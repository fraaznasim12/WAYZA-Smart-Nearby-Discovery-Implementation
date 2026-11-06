package com.accessmap.dto;

import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Response DTO for a single accessibility feature within a Place.
 *
 * <p>Uses a Java 21 {@code record} — immutable, with auto-generated
 * constructor, getters, {@code equals}, {@code hashCode}, and {@code toString}.
 *
 * @param id             the unique feature identifier
 * @param featureType    the type of accessibility feature
 * @param status         the four-state verification status
 * @param notes          optional auditor notes
 * @param lastVerifiedAt timestamp of the most recent field audit
 */
public record AccessibilityFeatureDto(
    UUID id,
    FeatureType featureType,
    FeatureStatus status,
    String notes,
    OffsetDateTime lastVerifiedAt
) {}

