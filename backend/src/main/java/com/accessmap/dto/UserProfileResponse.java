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
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        UserRole role,
        OffsetDateTime memberSince
) {}

