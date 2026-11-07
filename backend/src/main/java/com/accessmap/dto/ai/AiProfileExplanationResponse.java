package com.accessmap.dto.ai;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Plain-language breakdown of a venue's accessibility profile.
 * Strictly adheres to 4-state taxonomy and never computes arbitrary scores.
 */
public record AiProfileExplanationResponse(
    UUID placeId,
    String placeName,
    String plainEnglishExplanation,
    List<String> confirmedAvailable,
    List<String> confirmedUnavailable,
    List<String> unknownFeatures,
    List<String> unverifiedObservations,
    OffsetDateTime lastVerifiedAt
) {}

