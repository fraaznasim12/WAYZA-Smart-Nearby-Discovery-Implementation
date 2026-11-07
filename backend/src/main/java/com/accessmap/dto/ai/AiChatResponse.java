package com.accessmap.dto.ai;

import com.accessmap.dto.PlaceDto;
import java.util.List;
import java.util.UUID;

/**
 * Structured output from the AI Accessibility Assistant.
 */
public record AiChatResponse(
    String reply,
    UUID placeId,
    String placeName,
    AiSearchFiltersDto structuredFilters,
    List<PlaceDto> matchedPlaces,
    List<String> suggestedQuestions,
    String modelUsed,
    String providerUsed
) {}

