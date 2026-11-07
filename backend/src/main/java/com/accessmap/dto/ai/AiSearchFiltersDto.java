package com.accessmap.dto.ai;

import java.util.List;

/**
 * Validated structured search parameters parsed from natural language queries.
 */
public record AiSearchFiltersDto(
    String category,
    String city,
    String state,
    List<String> requiredFeatures,
    String extractedKeyword
) {}

