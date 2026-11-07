package com.accessmap.dto;

import jakarta.validation.constraints.NotBlank;

public record PlatformSettingUpdateRequest(
    @NotBlank(message = "Setting value cannot be blank")
    String value
) {}

