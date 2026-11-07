package com.accessmap.provider;

import java.util.List;

/**
 * Abstraction over external geospatial data providers.
 *
 * <p>Implementations fetch place data from external sources (OpenStreetMap Overpass,
 * Google Places, etc.) and normalize results into {@link OsmPlace} records.
 *
 * <p>All implementations <strong>must</strong>:
 * <ul>
 *   <li>Handle provider unavailability gracefully (never throw unchecked exceptions to callers).</li>
 *   <li>Apply appropriate rate limiting to respect upstream usage policies.</li>
 *   <li>Return an empty list when the provider is unavailable or the query yields no results.</li>
 * </ul>
 */
public interface PlaceDataProvider {

    /**
     * Searches for places within a geographic bounding box, optionally filtered by category.
     *
     * @param south      minimum latitude of the bounding box
     * @param west       minimum longitude of the bounding box
     * @param north      maximum latitude of the bounding box
     * @param east       maximum longitude of the bounding box
     * @param categories list of AccessMap category codes to filter by; pass empty list for all
     * @return list of normalized places (never {@code null}; may be empty)
     */
    List<OsmPlace> searchByBoundingBox(
            double south, double west, double north, double east,
            List<String> categories);

    /**
     * Returns {@code true} when the provider is currently reachable and healthy.
     *
     * <p>Implementations should perform a lightweight availability check and cache
     * the result for a short period to avoid hammering the upstream on every call.
     */
    boolean isAvailable();

    /**
     * Returns a human-readable name for this provider (used in logging and admin responses).
     */
    String getProviderName();
}
