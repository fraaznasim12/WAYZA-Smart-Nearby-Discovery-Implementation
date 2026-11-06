package com.accessmap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for user registration.
 *
 * <p>SECURITY: The {@code role} field has been intentionally removed.
 * Public registration always assigns {@link com.accessmap.entity.UserRole#ROLE_USER}.
 * Privileged roles (ROLE_ADMIN, ROLE_BUSINESS) can only be assigned by administrators.
 */
public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    String password,

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    String fullName
) {}

