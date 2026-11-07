package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminPlaceSummaryDto(
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
    Boolean isActive,
    String sourceName,
    String externalSourceId,
    String phone,
    String website,
    OffsetDateTime createdAt,
    OffsetDateTime lastImportedAt,
    int verifiedFeaturesCount
) {}

