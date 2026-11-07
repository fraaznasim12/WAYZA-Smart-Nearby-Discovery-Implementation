package com.accessmap.dto;

import com.accessmap.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record AdminUserRoleUpdateRequest(
    @NotNull(message = "Target user role must be specified")
    UserRole role,

    String reason
) {}

