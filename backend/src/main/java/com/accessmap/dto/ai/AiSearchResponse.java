package com.accessmap.dto.ai;

import com.accessmap.dto.PlaceDto;
import java.util.List;

/**
 * Result of natural language place search query, backed strictly by real database records.
 */
public record AiSearchResponse(
    String originalQuery,
    AiSearchFiltersDto extractedFilters,
    List<PlaceDto> places,
    String explanation,
    int totalResults
) {}

