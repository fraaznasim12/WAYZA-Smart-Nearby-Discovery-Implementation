package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PlatformSettingDto(
    UUID id,
    String key,
    String value,
    String group,
    String description,
    OffsetDateTime updatedAt,
    String updatedByEmail
) {}

