package com.accessmap.dto;

import com.accessmap.entity.UserRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserSummaryDto(
    UUID id,
    String email,
    String fullName,
    UserRole role,
    Boolean isEnabled,
    String avatarObjectKey,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    long reportsCount,
    long disputesCount,
    long observationsCount
) {}

