package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PlaceOwnershipDto(
    UUID id,
    UUID placeId,
    String placeName,
    UUID userId,
    String userEmail,
    String userFullName,
    Boolean isVerified,
    OffsetDateTime verifiedAt,
    OffsetDateTime createdAt
) {}

