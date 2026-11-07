package com.accessmap.dto;

import com.accessmap.entity.FeatureStatus;

import java.time.OffsetDateTime;

/**
 * Detailed accessibility status for a specific feature on a place profile.
 */
public record FeatureStatusDto(
    String code,
    String name,
    String category,
    String description,
    String icon,
    FeatureStatus status,
    String notes,
    OffsetDateTime lastVerifiedAt
) {}

