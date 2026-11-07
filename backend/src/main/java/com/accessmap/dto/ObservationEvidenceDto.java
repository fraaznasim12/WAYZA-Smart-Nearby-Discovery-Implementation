package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ObservationEvidenceDto(
    UUID id,
    String imageUrl,
    String caption,
    String featureCode,
    OffsetDateTime uploadedAt
) {}

