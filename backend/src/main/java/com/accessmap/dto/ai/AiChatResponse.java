package com.accessmap.dto.ai;

import com.accessmap.dto.PlaceDto;
import java.util.List;
import java.util.UUID;

/**
 * Structured, verifiable output from the AI Accessibility Assistant.
 * Grounded in database records with explicit provenance citations and reliability indicators.
 */
public record AiChatResponse(
    String reply,
    UUID placeId,
    String placeName,
    AiSearchFiltersDto structuredFilters,
    List<PlaceDto> matchedPlaces,
    List<AiEvidenceSourceDto> sources,
    String reliabilityRating, // 'HIGH_EVIDENCE', 'COMMUNITY_REPORTED', 'INSUFFICIENT_DATA', 'GENERAL_ASSISTANCE'
    List<String> suggestedQuestions,
    String modelUsed,
    String providerUsed
) {
    // Backward-compatible constructor
    public AiChatResponse(String reply, UUID placeId, String placeName, AiSearchFiltersDto structuredFilters,
                          List<PlaceDto> matchedPlaces, List<String> suggestedQuestions, String modelUsed, String providerUsed) {
        this(reply, placeId, placeName, structuredFilters, matchedPlaces, List.of(), "GENERAL_ASSISTANCE", suggestedQuestions, modelUsed, providerUsed);
    }
}
