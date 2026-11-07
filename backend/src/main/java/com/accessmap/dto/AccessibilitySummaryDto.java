package com.accessmap.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Concise summary DTO for quick accessibility status badges and cards.
 *
 * <p>Provides aggregated metrics (available, not available, unknown, not verified)
 * and an overall score without transferring the complete feature list.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AccessibilitySummaryDto(
        UUID placeId,
        String placeName,
        String overallStatus,
        int availableCount,
        int notAvailableCount,
        int unknownCount,
        int notVerifiedCount,
        int totalFeatures,
        double scorePercentage,
        OffsetDateTime lastVerifiedAt,
        Map<String, Integer> categoryAvailableCounts
) {}

