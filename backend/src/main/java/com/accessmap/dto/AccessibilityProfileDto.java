package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Aggregated accessibility profile for a place.
 *
 * <p><strong>CRITICAL ARCHITECTURE REQUIREMENT:</strong>
 * Never aggregates into a single arbitrary "score" or implies that a location is fully accessible.
 * Displays distinct four-state counts, latest verification timestamp, and individual feature breakdowns.
 */
public record AccessibilityProfileDto(
    UUID placeId,
    String placeName,
    int availableCount,
    int notAvailableCount,
    int unknownCount,
    int notVerifiedCount,
    int totalTrackedFeatures,
    OffsetDateTime lastVerifiedAt,
    long pendingObservationsCount,
    List<FeatureStatusDto> features,
    List<ObservationSubmissionDto> recentObservations
) {}

