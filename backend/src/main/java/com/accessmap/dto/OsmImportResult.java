package com.accessmap.dto;

/**
 * Summary result returned by the OSM import endpoint.
 */
public record OsmImportResult(
        /** Number of new places successfully saved. */
        int importedCount,

        /** Number of places skipped because they already exist (deduplication). */
        int skippedCount,

        /** Number of records that failed to save due to data or constraint errors. */
        int failedCount,

        /** Total records returned by the external provider before deduplication. */
        int totalFetched,

        /** Human-readable status message. */
        String message,

        /** Name of the data provider that was queried. */
        String provider,

        /** Whether the provider was reachable. */
        boolean providerAvailable
) {

    /** Convenience factory for when the provider is unreachable. */
    public static OsmImportResult unavailable(String providerName) {
        return new OsmImportResult(0, 0, 0, 0,
                "Provider '" + providerName + "' is currently unavailable. No data was imported.",
                providerName, false);
    }
}
