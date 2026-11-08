package com.accessmap.dto.location;

/**
 * Representation of an Indian City or Town.
 */
public record CityDto(
    String name,
    String district,
    String state,
    Double latitude,
    Double longitude
) {}

