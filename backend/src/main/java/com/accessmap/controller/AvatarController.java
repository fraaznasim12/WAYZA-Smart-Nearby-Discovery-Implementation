package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.AvatarResponse;
import com.accessmap.entity.User;
import com.accessmap.service.AvatarService;
import com.accessmap.service.MediaStorageService.MediaUploadException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST Controller for user profile avatar management.
 *
 * <h3>Endpoints</h3>
 * <ul>
 *   <li>{@code PUT /api/v1/users/me/avatar} — upload or replace avatar</li>
 *   <li>{@code GET /api/v1/users/me/avatar} — get avatar metadata and pre-signed URL</li>
 *   <li>{@code DELETE /api/v1/users/me/avatar} — remove avatar</li>
 * </ul>
 *
 * <h3>Security</h3>
 * All endpoints require an authenticated JWT. Users can only access and modify their own avatar.
 * Object storage credentials are never exposed in responses — only short-lived pre-signed URLs.
 */
@RestController
@RequestMapping("/api/v1/users/me/avatar")
@RequiredArgsConstructor
@Slf4j
public class AvatarController {

    private final AvatarService avatarService;

    /**
     * PUT /api/v1/users/me/avatar
     *
     * <p>Uploads or replaces the authenticated user's profile avatar.
     * Accepts a multipart/form-data request with a single file field named {@code file}.
     *
     * <p>The uploaded image is validated (JPEG / PNG / WebP only), re-encoded to WebP
     * (stripping EXIF metadata including GPS), and stored in object storage.
     *
     * <p>If the user already has an avatar, the old file is deleted from storage.
     *
     * @param currentUser injected from the validated JWT
     * @param file        the uploaded image file
     * @return 200 OK with avatar metadata and a pre-signed URL
     */
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AvatarResponse>> uploadAvatar(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file) {

        try {
            AvatarResponse response = avatarService.uploadAvatar(currentUser, file);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (MediaUploadException ex) {
            log.warn("Avatar upload rejected for user {}: {}", currentUser.getId(), ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(ApiResponse.error("UPLOAD_ERROR", ex.getMessage()));
        }
    }

    /**
     * GET /api/v1/users/me/avatar
     *
     * <p>Returns the current avatar metadata and a fresh pre-signed URL for the authenticated user.
     * Returns 404 when no avatar has been uploaded yet.
     *
     * @param currentUser injected from the validated JWT
     * @return 200 OK with avatar data, or 404 if no avatar exists
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AvatarResponse>> getAvatar(
            @AuthenticationPrincipal User currentUser) {

        AvatarResponse response = avatarService.getAvatar(currentUser);
        if (response == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "No avatar uploaded for this user."));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * DELETE /api/v1/users/me/avatar
     *
     * <p>Removes the authenticated user's avatar from storage and clears the database record.
     * Returns 204 No Content on success, or 404 if no avatar exists.
     *
     * @param currentUser injected from the validated JWT
     * @return 204 on success, 404 if no avatar
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAvatar(
            @AuthenticationPrincipal User currentUser) {

        boolean removed = avatarService.deleteAvatar(currentUser);
        if (!removed) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}

