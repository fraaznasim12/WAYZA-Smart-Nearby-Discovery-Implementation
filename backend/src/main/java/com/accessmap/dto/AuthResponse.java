package com.accessmap.dto;

import com.accessmap.entity.UserRole;

import java.util.UUID;

/**
 * Response payload returned upon successful authentication.
 */
public record AuthResponse(
    String token,
    String tokenType,
    UUID userId,
    String email,
    String fullName,
    UserRole role
) {
    public static AuthResponse of(String token, UUID userId, String email, String fullName, UserRole role) {
        return new AuthResponse(token, "Bearer", userId, email, fullName, role);
    }
}

