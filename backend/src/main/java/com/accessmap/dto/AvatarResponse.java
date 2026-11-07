package com.accessmap.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

/**
 * Response payload returned by avatar upload, retrieval, and URL-refresh endpoints.
 *
 * <p>The {@code avatarUrl} is a short-lived pre-signed GET URL pointing to the
 * avatar image in object storage. Clients should not cache this URL beyond its
 * expiry period (default: 60 minutes). Storage credentials are never exposed.
 *
 * <p>{@code null} fields are omitted from JSON output.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AvatarResponse(
        /** UUID of the MediaFile metadata record. */
        UUID mediaId,

        /**
         * Short-lived pre-signed URL to retrieve the avatar image.
         * Null if object storage is unreachable at the time of the request.
         */
        String avatarUrl,

        /** Validated MIME type of the stored image (always {@code image/webp} after re-encoding). */
        String mimeType,

        /** Size of the stored (re-encoded) file in bytes. */
        Long fileSizeBytes,

        /** ISO-8601 timestamp of when the avatar was uploaded. */
        String uploadedAt
) {}

