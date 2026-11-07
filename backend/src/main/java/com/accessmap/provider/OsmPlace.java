package com.accessmap.provider;

/**
 * Lightweight data-transfer object representing a place returned by an external
 * geospatial data provider such as the OpenStreetMap Overpass API.
 *
 * <p>All string fields may be {@code null} when the upstream source does not
 * supply them. Callers must handle {@code null} gracefully.
 */
public record OsmPlace(
        /** Provider-specific unique identifier, e.g. {@code "osm:node:3547829101"}. */
        String externalId,

        /** Human-readable name from the upstream source. */
        String name,

        /** AccessMap category code derived from OSM tags (e.g. {@code "HOSPITAL"}). */
        String category,

        /** WGS84 latitude. */
        double latitude,

        /** WGS84 longitude. */
        double longitude,

        /** Full street address if available, otherwise partial or {@code null}. */
        String address,

        /** City / locality name if available. */
        String city,

        /** State / administrative region if available. */
        String state,

        /** Postal / PIN code if available. */
        String postalCode,

        /** Country name; defaults to "India" when absent. */
        String country,

        /** Phone number if available. */
        String phone,

        /** Website URL if available. */
        String website,

        /** Short description derived from OSM tags if available. */
        String description
) {}
