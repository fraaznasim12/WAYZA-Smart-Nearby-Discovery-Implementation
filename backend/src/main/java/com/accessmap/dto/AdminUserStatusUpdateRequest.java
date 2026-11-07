package com.accessmap.dto;

import jakarta.validation.constraints.NotNull;

public record AdminUserStatusUpdateRequest(
    @NotNull(message = "isEnabled status must be provided")
    Boolean isEnabled,

    String reason
) {}

