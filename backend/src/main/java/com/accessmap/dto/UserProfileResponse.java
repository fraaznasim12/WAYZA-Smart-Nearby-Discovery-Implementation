package com.accessmap.dto;

import com.accessmap.entity.UserRole;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Response payload for GET /api/v1/auth/me.
 *
 * <p>Contains the authenticated user's profile information.
 * Password hashes and internal fields are intentionally excluded.
 *
 * <p>{@code avatarUrl} is a short-lived pre-signed URL to retrieve the user's
 * avatar from object storage. It is {@code null} when no avatar has been uploaded.
 * Clients should refresh this URL periodically (default expiry: 60 minutes).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        UserRole role,
        OffsetDateTime memberSince,

        /**
         * Pre-signed URL for the user's avatar image, or {@code null} if no avatar exists.
         * Expires after the configured presigned URL duration (default: 60 minutes).
         */
        String avatarUrl
) {}
