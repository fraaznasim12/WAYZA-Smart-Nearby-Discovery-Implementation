package com.accessmap.controller;

import com.accessmap.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Public REST Controller for serving uploaded media files (avatars, evidence photos).
 *
 * <p>Enables browser {@code <img>} tags and clients to fetch stored media seamlessly
 * without exposing local filesystem paths or requiring AWS/MinIO signed URL dependencies.
 */
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final MediaStorageService mediaStorageService;

    private static final Set<String> ALLOWED_FOLDERS = Set.of(
            "avatars",
            "evidence",
            "disputes",
            "reports"
    );

    /**
     * GET /api/v1/media/{folder}/{filename}
     *
     * <p>Streams the requested media file content with appropriate MIME type headers.
     * Prevents path traversal and validates folder names.
     *
     * @param folder   the media folder (e.g. avatars, evidence)
     * @param filename the randomized UUID filename
     * @return raw image bytes with public caching headers, or 404/400
     */
    @GetMapping("/{folder}/{filename}")
    public ResponseEntity<byte[]> getMedia(
            @PathVariable String folder,
            @PathVariable String filename) {

        // Strict path traversal defense
        if (folder.contains("..") || filename.contains("..") ||
            folder.contains("/") || folder.contains("\\") ||
            filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        if (!ALLOWED_FOLDERS.contains(folder.toLowerCase())) {
            return ResponseEntity.badRequest().build();
        }

        String objectKey = folder + "/" + filename;

        try {
            byte[] bytes = mediaStorageService.retrieveObjectBytes(objectKey);

            MediaType mediaType = MediaType.IMAGE_JPEG;
            String lower = filename.toLowerCase();
            if (lower.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (lower.endsWith(".webp")) {
                mediaType = MediaType.parseMediaType("image/webp");
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                    .body(bytes);

        } catch (MediaStorageService.MediaUploadException ex) {
            log.debug("Media object not found: {}", objectKey);
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            log.warn("Error serving media object '{}': {}", objectKey, ex.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}

