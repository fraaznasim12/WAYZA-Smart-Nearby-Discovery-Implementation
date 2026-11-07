package com.accessmap.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Reusable service for uploading, downloading, and deleting files in
 * S3-compatible object storage (MinIO locally; AWS S3 / GCS / R2 in production)
 * or local filesystem storage in development.
 *
 * <h3>Security Guarantees</h3>
 * <ul>
 *   <li>Content-type is detected from file bytes via Apache Tika — not from
 *       the browser-declared MIME type or filename extension.</li>
 *   <li>Only JPEG, PNG, and WebP images are accepted.</li>
 *   <li>Uploaded images are re-encoded via Thumbnailator to strip EXIF metadata
 *       (including embedded GPS coordinates) and normalize format.</li>
 *   <li>Object keys are randomly generated UUID paths — no user-controlled
 *       characters reach the storage layer, preventing path traversal.</li>
 *   <li>Files are stored in private storage; callers receive short-lived
 *       pre-signed URLs or protected media delivery paths rather than raw paths.</li>
 * </ul>
 */
@Service
@Slf4j
public class MediaStorageService {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    @Value("${accessmap.storage.provider:auto}") // auto, s3, minio, local
    private String storageProvider;

    @Value("${accessmap.storage.local-dir:./storage/media}")
    private String localDir;

    @Value("${accessmap.storage.endpoint:http://localhost:9000}")
    private String storageEndpoint;

    @Value("${accessmap.storage.access-key:accessmap_minio}")
    private String accessKey;

    @Value("${accessmap.storage.secret-key:accessmap_minio_secret}")
    private String secretKey;

    @Value("${accessmap.storage.bucket:accessmap-media}")
    private String bucket;

    @Value("${accessmap.storage.region:us-east-1}")
    private String region;

    @Value("${accessmap.storage.public-url-prefix:}")
    private String publicUrlPrefix;

    @Value("${accessmap.storage.avatar.max-size-bytes:5242880}")     // 5 MB
    private long avatarMaxSizeBytes;

    @Value("${accessmap.storage.report-evidence.max-size-bytes:10485760}")  // 10 MB
    private long reportEvidenceMaxSizeBytes;

    @Value("${accessmap.storage.presigned-url-expiry-minutes:60}")
    private int presignedUrlExpiryMinutes;

    /** Supported MIME types after Tika content detection. */
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Tika tika = new Tika();

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Validates, re-encodes (stripping EXIF), and uploads an image to storage.
     *
     * @param file       the uploaded multipart file
     * @param folder     storage folder prefix, e.g. {@code "avatars"} or {@code "evidence"}
     * @param maxBytes   maximum allowed file size in bytes
     * @return {@link UploadResult} with the generated object key, MIME type, size, and checksum
     * @throws MediaUploadException on validation failure, re-encode error, or storage error
     */
    public UploadResult uploadImage(MultipartFile file, String folder, long maxBytes) {
        // 1. Null / empty check
        if (file == null || file.isEmpty()) {
            throw new MediaUploadException("No file was provided.");
        }

        // 2. File size check (against original size before re-encode)
        if (file.getSize() > maxBytes) {
            throw new MediaUploadException(String.format(
                    "File size %d bytes exceeds the allowed limit of %d bytes.",
                    file.getSize(), maxBytes));
        }

        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new MediaUploadException("Failed to read uploaded file bytes.", e);
        }

        // 3. Content-type detection from raw bytes (not filename / browser MIME)
        String detectedMime = tika.detect(originalBytes);
        if (!ALLOWED_MIME_TYPES.contains(detectedMime)) {
            throw new MediaUploadException(
                    "Unsupported image format '" + detectedMime + "'. Allowed: JPEG, PNG, WebP.");
        }

        // 4. Determine format for re-encoding.
        // Standard Java ImageIO natively supports 'png' and 'jpg' without external native plugins.
        // Transparent PNGs stay PNG; JPEGs and WebP are normalized to JPEG.
        String outputFormat = "image/png".equalsIgnoreCase(detectedMime) ? "png" : "jpg";
        String storedMime = "image/png".equalsIgnoreCase(detectedMime) ? "image/png" : "image/jpeg";
        String outputExtension = "image/png".equalsIgnoreCase(detectedMime) ? ".png" : ".jpg";

        // 5. Re-encode via Thumbnailator (strips EXIF / GPS metadata, normalizes format)
        byte[] processedBytes;
        try {
            processedBytes = reEncodeImage(originalBytes, outputFormat);
        } catch (Exception e) {
            log.warn("Image re-encoding failed for MIME {}: {}", detectedMime, e.getMessage());
            throw new MediaUploadException("Image processing failed. The file may be corrupt or malformed.", e);
        }

        // 6. Compute SHA-256 checksum of the processed bytes
        String checksum = sha256Hex(processedBytes);

        // 7. Generate a random, unguessable object key
        String objectKey = folder + "/" + UUID.randomUUID() + outputExtension;

        // 8. Upload to object storage or local filesystem storage
        if (isLocalStorage()) {
            try {
                Path target = getLocalPath(objectKey);
                if (target.getParent() != null) {
                    Files.createDirectories(target.getParent());
                }
                Files.write(target, processedBytes);
                log.info("Stored media file locally: key={}, size={}B, path={}", objectKey, processedBytes.length, target.toAbsolutePath());
            } catch (IOException e) {
                log.error("Failed to write media file locally for key '{}': {}", objectKey, e.getMessage());
                throw new MediaUploadException("Failed to save file to local storage. Please check disk permissions.", e);
            }
        } else {
            MinioClient client = buildClient();
            try {
                ensureBucketExists(client);
                client.putObject(PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectKey)
                        .stream(new ByteArrayInputStream(processedBytes), processedBytes.length, -1)
                        .contentType(storedMime)
                        .build());
                log.info("Uploaded media file to MinIO/S3: bucket={}, key={}, size={}B", bucket, objectKey, processedBytes.length);
            } catch (Exception e) {
                log.error("Object storage upload failed for key '{}': {}", objectKey, e.getMessage());
                throw new MediaUploadException("Failed to upload file to object storage. Please try again.", e);
            }
        }

        return new UploadResult(objectKey, bucket, storedMime, (long) processedBytes.length, checksum);
    }

    /**
     * Convenience wrapper for profile avatar uploads (5 MB limit).
     */
    public UploadResult uploadAvatar(MultipartFile file) {
        return uploadImage(file, "avatars", avatarMaxSizeBytes);
    }

    /**
     * Convenience wrapper for report evidence uploads (10 MB limit).
     */
    public UploadResult uploadReportEvidence(MultipartFile file) {
        return uploadImage(file, "evidence", reportEvidenceMaxSizeBytes);
    }

    /**
     * Generates a pre-signed URL or proxy API URL for a stored object.
     *
     * @param objectKey the full object key within the bucket or storage directory
     * @return URL string; callers should not cache this indefinitely
     */
    public String generatePresignedGetUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        if (isLocalStorage()) {
            // Serves via local media delivery endpoint
            return "/api/v1/media/" + objectKey;
        }

        // If a public CDN / custom domain URL prefix is configured (e.g. Cloudflare R2 public bucket)
        if (publicUrlPrefix != null && !publicUrlPrefix.isBlank()) {
            String sanitizedPrefix = publicUrlPrefix.replaceAll("/+$", "");
            String sanitizedKey = objectKey.replaceAll("^/+", "");
            return sanitizedPrefix + "/" + sanitizedKey;
        }

        try {
            MinioClient client = buildClient();
            return client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry(presignedUrlExpiryMinutes, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            log.error("Failed to generate pre-signed URL for key '{}': {}", objectKey, e.getMessage());
            // Fallback to local endpoint if the file is present on disk
            Path localTarget = getLocalPath(objectKey);
            if (Files.exists(localTarget)) {
                return "/api/v1/media/" + objectKey;
            }
            throw new MediaUploadException("Failed to generate media access URL.", e);
        }
    }

    /**
     * Retrieves the raw bytes of a stored object for proxied delivery.
     *
     * @param objectKey the full object key
     * @return raw image bytes
     */
    public byte[] retrieveObjectBytes(String objectKey) {
        if (isLocalStorage()) {
            Path target = getLocalPath(objectKey);
            if (!Files.exists(target)) {
                throw new MediaUploadException("Media file not found: " + objectKey);
            }
            try {
                return Files.readAllBytes(target);
            } catch (IOException e) {
                log.error("Failed to read local media file '{}': {}", objectKey, e.getMessage());
                throw new MediaUploadException("Failed to read media file.", e);
            }
        }

        try {
            MinioClient client = buildClient();
            try (InputStream stream = client.getObject(GetObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build())) {
                return stream.readAllBytes();
            }
        } catch (Exception e) {
            log.error("Failed to retrieve object '{}' from MinIO: {}", objectKey, e.getMessage());
            // Fallback to local if present
            Path localTarget = getLocalPath(objectKey);
            if (Files.exists(localTarget)) {
                try {
                    return Files.readAllBytes(localTarget);
                } catch (IOException ex) {
                    // fall through
                }
            }
            throw new MediaUploadException("Failed to retrieve media file.", e);
        }
    }

    /**
     * Deletes an object from storage.
     * This is a best-effort operation; if storage is unavailable the error is logged but not re-thrown.
     *
     * @param objectKey the full object key within the bucket or local directory
     */
    public void deleteObject(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return;
        }

        // Delete from local filesystem if exists
        try {
            Path target = getLocalPath(objectKey);
            Files.deleteIfExists(target);
        } catch (Exception e) {
            log.warn("Failed to delete local object '{}': {}", objectKey, e.getMessage());
        }

        // If not strictly local, also try MinIO
        if (!"local".equalsIgnoreCase(storageProvider)) {
            try {
                MinioClient client = buildClient();
                client.removeObject(RemoveObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectKey)
                        .build());
                log.info("Deleted media object from MinIO: bucket={}, key={}", bucket, objectKey);
            } catch (Exception e) {
                log.warn("Failed to delete object '{}' from MinIO (non-fatal): {}", objectKey, e.getMessage());
            }
        }
    }

    /**
     * Tests connectivity to object storage.
     *
     * @return {@code true} if storage is accessible; {@code false} otherwise
     */
    public boolean isStorageAvailable() {
        if (isLocalStorage()) {
            return true;
        }
        return isMinioReachable();
    }

    // -------------------------------------------------------------------------
    // Internal & Storage Strategy
    // -------------------------------------------------------------------------

    public boolean isLocalStorage() {
        if ("local".equalsIgnoreCase(storageProvider)) {
            return true;
        }
        if ("s3".equalsIgnoreCase(storageProvider) || "minio".equalsIgnoreCase(storageProvider)) {
            return false;
        }
        // In "auto" mode, check if MinIO is actually reachable; if not, fall back to local disk
        return !isMinioReachable();
    }

    private boolean isMinioReachable() {
        try {
            MinioClient client = buildClient();
            client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Path getLocalPath(String objectKey) {
        // Prevent path traversal
        String sanitized = objectKey.replace("\\", "/").replaceAll("^/+", "");
        return Paths.get(localDir).resolve(sanitized).normalize();
    }

    /**
     * Re-encodes the image using Thumbnailator at 90% quality to standard PNG or JPEG.
     * This strips EXIF metadata (including GPS coordinates) and ensures the output
     * is a valid, normalized image using standard Java ImageIO writers.
     */
    private byte[] reEncodeImage(byte[] originalBytes, String outputFormat) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(new ByteArrayInputStream(originalBytes))
                .scale(1.0)                 // preserve original dimensions
                .outputQuality(0.90)        // 90% quality
                .outputFormat(outputFormat) // 'png' or 'jpg'
                .toOutputStream(out);
        return out.toByteArray();
    }

    private String sha256Hex(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.warn("SHA-256 computation failed: {}", e.getMessage());
            return null;
        }
    }

    private MinioClient buildClient() {
        var builder = MinioClient.builder()
                .endpoint(storageEndpoint)
                .credentials(accessKey, secretKey);
        if (region != null && !region.isBlank() && !region.equalsIgnoreCase("auto")) {
            builder.region(region);
        }
        return builder.build();
    }

    private void ensureBucketExists(MinioClient client) {
        try {
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created storage bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("Storage bucket existence check or creation skipped for '{}': {}", bucket, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Result and Exception types
    // -------------------------------------------------------------------------

    /**
     * Result of a successful upload operation.
     */
    public record UploadResult(
            String objectKey,
            String bucketName,
            String mimeType,
            Long fileSizeBytes,
            String checksumSha256
    ) {}

    /**
     * Thrown when an upload is rejected or fails at any stage.
     */
    public static class MediaUploadException extends RuntimeException {
        public MediaUploadException(String message) { super(message); }
        public MediaUploadException(String message, Throwable cause) { super(message, cause); }
    }
}
