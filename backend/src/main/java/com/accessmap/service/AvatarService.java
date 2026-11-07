package com.accessmap.service;

import com.accessmap.dto.AvatarResponse;
import com.accessmap.entity.MediaFile;
import com.accessmap.entity.User;
import com.accessmap.repository.MediaFileRepository;
import com.accessmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Service managing user profile avatar upload, retrieval, and removal.
 *
 * <h3>Security Model</h3>
 * <ul>
 *   <li>Users can only update or remove their own avatar.</li>
 *   <li>All uploads are routed through {@link MediaStorageService} which validates
 *       content type, re-encodes the image, and strips EXIF metadata.</li>
 *   <li>When a new avatar replaces an old one, the old object is deleted from
 *       storage and the old {@link MediaFile} record is removed from the database.</li>
 *   <li>The returned {@link AvatarResponse} carries a short-lived pre-signed URL —
 *       storage credentials are never exposed to the client.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvatarService {

    private final MediaStorageService mediaStorageService;
    private final MediaFileRepository mediaFileRepository;
    private final UserRepository userRepository;

    private static final String PURPOSE_AVATAR = "USER_AVATAR";

    /**
     * Uploads (or replaces) the authenticated user's profile avatar.
     *
     * <p>Steps:
     * <ol>
     *   <li>Validate and re-encode the image via {@link MediaStorageService}.</li>
     *   <li>Upload the processed image to object storage.</li>
     *   <li>Persist a new {@link MediaFile} record in the database.</li>
     *   <li>Update {@code user.avatarObjectKey} and {@code user.avatarMedia}.</li>
     *   <li>Delete the old object from storage and old DB record if one existed.</li>
     * </ol>
     *
     * @param currentUser the authenticated user (from Spring Security context)
     * @param file        the uploaded multipart image
     * @return metadata and a pre-signed URL for the new avatar
     */
    @Transactional
    public AvatarResponse uploadAvatar(User currentUser, MultipartFile file) {
        // 1. Capture old object key before we overwrite (for cleanup)
        String oldObjectKey = currentUser.getAvatarObjectKey();
        UUID oldMediaId = currentUser.getAvatarMedia() != null
                ? currentUser.getAvatarMedia().getId() : null;

        // 2. Upload to storage (validates, re-encodes, strips EXIF)
        MediaStorageService.UploadResult result = mediaStorageService.uploadAvatar(file);

        // 3. Create the MediaFile metadata record
        MediaFile mediaFile = MediaFile.builder()
                .owner(currentUser)
                .purpose(PURPOSE_AVATAR)
                .objectKey(result.objectKey())
                .bucketName(result.bucketName())
                .mimeType(result.mimeType())
                .fileSizeBytes(result.fileSizeBytes())
                .checksumSha256(result.checksumSha256())
                .visibility("APPROVED")
                .build();
        MediaFile saved = mediaFileRepository.save(mediaFile);

        // 4. Update the user record
        currentUser.setAvatarObjectKey(result.objectKey());
        currentUser.setAvatarMedia(saved);
        userRepository.save(currentUser);

        // 5. Clean up old avatar (best-effort — do not fail the transaction)
        if (oldObjectKey != null) {
            try {
                mediaStorageService.deleteObject(oldObjectKey);
            } catch (Exception ex) {
                log.warn("Failed to delete old avatar object '{}': {}", oldObjectKey, ex.getMessage());
            }
        }
        if (oldMediaId != null) {
            try {
                mediaFileRepository.deleteById(oldMediaId);
            } catch (Exception ex) {
                log.warn("Failed to delete old MediaFile record {}: {}", oldMediaId, ex.getMessage());
            }
        }

        log.info("Avatar uploaded for user {} → object key: {}", currentUser.getId(), result.objectKey());

        // 6. Build response with pre-signed URL
        String presignedUrl = generateAvatarUrl(result.objectKey());
        return new AvatarResponse(
                saved.getId(),
                presignedUrl,
                result.mimeType(),
                result.fileSizeBytes(),
                saved.getUploadedAt() != null ? saved.getUploadedAt().toString() : null
        );
    }

    /**
     * Retrieves the current avatar for a user.
     *
     * @param currentUser the authenticated user
     * @return avatar metadata with a fresh pre-signed URL, or {@code null} if no avatar exists
     */
    @Transactional(readOnly = true)
    public AvatarResponse getAvatar(User currentUser) {
        if (currentUser.getAvatarObjectKey() == null) {
            return null;
        }
        // Load the full MediaFile record to get metadata
        MediaFile mediaFile = currentUser.getAvatarMedia();
        if (mediaFile == null) {
            // Orphaned object key — treat as no avatar
            return null;
        }
        String presignedUrl = generateAvatarUrl(currentUser.getAvatarObjectKey());
        return new AvatarResponse(
                mediaFile.getId(),
                presignedUrl,
                mediaFile.getMimeType(),
                mediaFile.getFileSizeBytes(),
                mediaFile.getUploadedAt() != null ? mediaFile.getUploadedAt().toString() : null
        );
    }

    /**
     * Removes the current avatar for a user.
     * Deletes the object from storage and clears the user's avatar fields.
     *
     * @param currentUser the authenticated user
     * @return {@code true} if an avatar existed and was removed; {@code false} if none existed
     */
    @Transactional
    public boolean deleteAvatar(User currentUser) {
        if (currentUser.getAvatarObjectKey() == null) {
            return false;
        }

        String objectKey = currentUser.getAvatarObjectKey();
        UUID mediaId = currentUser.getAvatarMedia() != null
                ? currentUser.getAvatarMedia().getId() : null;

        // Clear user fields first (FK)
        currentUser.setAvatarObjectKey(null);
        currentUser.setAvatarMedia(null);
        userRepository.save(currentUser);

        // Delete storage object
        mediaStorageService.deleteObject(objectKey);

        // Delete DB record
        if (mediaId != null) {
            mediaFileRepository.deleteById(mediaId);
        }

        log.info("Avatar deleted for user {}", currentUser.getId());
        return true;
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    private String generateAvatarUrl(String objectKey) {
        try {
            return mediaStorageService.generatePresignedGetUrl(objectKey);
        } catch (Exception e) {
            log.warn("Failed to generate avatar URL for key '{}': {}", objectKey, e.getMessage());
            return null;
        }
    }
}

