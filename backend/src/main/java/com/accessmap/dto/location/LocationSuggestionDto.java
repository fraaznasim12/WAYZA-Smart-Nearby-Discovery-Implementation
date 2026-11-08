package com.accessmap.dto.location;

/**
 * Autocomplete location suggestion with state/district disambiguation.
 */
public record LocationSuggestionDto(
    String label,      // e.g. "Jamshedpur (East Singhbhum, Jharkhand)"
    String name,       // e.g. "Jamshedpur"
    String type,       // 'CITY', 'DISTRICT', 'STATE'
    String district,   // e.g. "East Singhbhum"
    String state,      // e.g. "Jharkhand"
    Double latitude,
    Double longitude
) {}

