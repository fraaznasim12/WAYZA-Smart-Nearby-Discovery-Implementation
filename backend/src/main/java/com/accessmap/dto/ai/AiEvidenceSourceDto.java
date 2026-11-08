package com.accessmap.dto.ai;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Verifiable evidence citation attached to an AI Assistant response.
 * Strictly presents facts from the database (verified audits and approved community reports)
 * to prevent hallucinations and establish reliable provenance.
 */
public record AiEvidenceSourceDto(
    UUID placeId,
    String venueName,
    String featureType,
    String status, // 'AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED'
    OffsetDateTime verificationDate,
    String sourceCategory, // 'INDEPENDENT_AUDIT', 'COMMUNITY_REPORT', 'PLATFORM_SEED', 'UNVERIFIED'
    String evidenceSummary,
    String reliabilityRating // 'HIGH_EVIDENCE', 'COMMUNITY_REPORTED', 'INSUFFICIENT_DATA', 'STALE_DATA'
) {}

