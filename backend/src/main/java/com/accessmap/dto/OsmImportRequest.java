package com.accessmap.dto;

import java.util.List;

/**
 * Request body for the admin OSM import endpoint.
 *
 * <p>All bounding-box coordinates are WGS84 (EPSG:4326).
 * {@code categories} is optional — omit or pass an empty list to import all supported types.
 */
public record OsmImportRequest(
        /** Southern boundary latitude (-90 to 90). */
        double south,

        /** Western boundary longitude (-180 to 180). */
        double west,

        /** Northern boundary latitude (-90 to 90). */
        double north,

        /** Eastern boundary longitude (-180 to 180). */
        double east,

        /**
         * Optional list of AccessMap category codes to restrict the import.
         * Example: {@code ["HOSPITAL", "UNIVERSITY", "RAILWAY_STATION"]}
         * Pass {@code null} or an empty list to import all supported categories.
         */
        List<String> categories
) {}
