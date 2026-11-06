package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing a Place with its full accessibility feature breakdown.
 *
 * <p>Uses a Java 21 {@code record} for immutable, clean data transfer between
 * the Service layer and the REST Controller.
 *
 * @param id         the unique venue identifier
 * @param name       the venue name
 * @param category   the venue category (e.g., HOSPITAL, COLLEGE)
 * @param address    the full address string
 * @param city       the city
 * @param latitude   WGS84 latitude coordinate
 * @param longitude  WGS84 longitude coordinate
 * @param features   list of accessibility feature statuses for this place
 * @param createdAt  timestamp when this venue was first registered
 * @param updatedAt  timestamp of the most recent update
 */
public record PlaceDto(
    UUID id,
    String name,
    String category,
    String address,
    String city,
    double latitude,
    double longitude,
    List<AccessibilityFeatureDto> features,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}

