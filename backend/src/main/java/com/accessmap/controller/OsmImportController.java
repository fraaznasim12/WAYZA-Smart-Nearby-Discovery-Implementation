package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.OsmImportRequest;
import com.accessmap.dto.OsmImportResult;
import com.accessmap.service.OsmImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only controller for triggering OpenStreetMap data imports.
 *
 * <p>All endpoints require the {@code ADMIN} role. Import operations are
 * idempotent — duplicate OSM records are detected by external source ID and
 * silently skipped, so repeated calls for the same bounding box are safe.
 */
@RestController
@RequestMapping("/api/v1/admin/import")
@RequiredArgsConstructor
@Slf4j
public class OsmImportController {

    private final OsmImportService osmImportService;

    /**
     * Triggers a bounding-box import from the OpenStreetMap Overpass API.
     *
     * <p>Returns immediately with a summary of imported, skipped, and failed records.
     * When the external provider is unavailable, returns a 200 response with
     * {@code providerAvailable=false} and {@code importedCount=0} rather than failing.
     *
     * <p>Example request body:
     * <pre>{@code
     * {
     *   "south": 23.3,
     *   "west":  85.2,
     *   "north": 23.5,
     *   "east":  85.4,
     *   "categories": ["HOSPITAL", "UNIVERSITY"]
     * }
     * }</pre>
     */
    @PostMapping("/osm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OsmImportResult>> importFromOsm(
            @RequestBody OsmImportRequest request) {

        log.info("Admin triggered OSM import for bbox [{},{},{},{}]",
                request.south(), request.west(), request.north(), request.east());

        OsmImportResult result = osmImportService.importByBoundingBox(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
