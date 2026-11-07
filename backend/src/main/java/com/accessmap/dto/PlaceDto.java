package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing a Place with geographical coordinates and accessibility breakdown.
 *
 * <p>Uses a Java 21 {@code record} for immutable, clean data transfer.
 */
public record PlaceDto(
    UUID id,
    String name,
    String description,
    String category,
    String address,
    String city,
    String state,
    String postalCode,
    String country,
    double latitude,
    double longitude,
    Double distanceMeters,
    String phone,
    String website,
    Boolean isActive,
    String sourceName,
    String externalSourceId,
    OffsetDateTime lastImportedAt,
    List<AccessibilityFeatureDto> features,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
