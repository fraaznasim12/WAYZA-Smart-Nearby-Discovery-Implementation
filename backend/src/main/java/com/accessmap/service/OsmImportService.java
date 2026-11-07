package com.accessmap.service;

import com.accessmap.dto.OsmImportRequest;
import com.accessmap.dto.OsmImportResult;
import com.accessmap.entity.AccessibilityFeature;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import com.accessmap.entity.Place;
import com.accessmap.provider.OsmPlace;
import com.accessmap.provider.PlaceDataProvider;
import com.accessmap.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service that imports place records from an external {@link PlaceDataProvider}
 * into the AccessMap PostgreSQL database.
 *
 * <h3>Deduplication</h3>
 * Each OSM element carries a unique external ID (e.g. {@code "osm:node:3547829101"}).
 * Before inserting, we check {@code PlaceRepository.existsByExternalSourceId}; if the
 * record already exists it is <strong>skipped entirely</strong> so community
 * accessibility observations and admin-approved data are never overwritten.
 *
 * <h3>Provider Unavailability</h3>
 * When the provider is unreachable this method returns a result with
 * {@code importedCount=0} and an explanatory message rather than throwing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OsmImportService {

    private final PlaceDataProvider placeDataProvider;
    private final PlaceRepository placeRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * Imports places from the configured external provider for the given bounding box.
     *
     * @param request import request containing bounding box and optional category filter
     * @return result summary with counts of imported, skipped and failed records
     */
    @Transactional
    public OsmImportResult importByBoundingBox(OsmImportRequest request) {
        if (!placeDataProvider.isAvailable()) {
            log.warn("OsmImportService: provider '{}' is not available. Import skipped.",
                    placeDataProvider.getProviderName());
            return OsmImportResult.unavailable(placeDataProvider.getProviderName());
        }

        log.info("Starting OSM import for bbox [{},{},{},{}], categories: {}",
                request.south(), request.west(), request.north(), request.east(),
                request.categories());

        List<OsmPlace> osmPlaces = placeDataProvider.searchByBoundingBox(
                request.south(), request.west(), request.north(), request.east(),
                request.categories() != null ? request.categories() : List.of());

        int imported = 0;
        int skipped = 0;
        int failed = 0;

        for (OsmPlace osmPlace : osmPlaces) {
            try {
                if (placeRepository.existsByExternalSourceId(osmPlace.externalId())) {
                    log.debug("Skipping duplicate OSM place: {} ({})", osmPlace.name(), osmPlace.externalId());
                    skipped++;
                    continue;
                }

                saveOsmPlace(osmPlace);
                imported++;
                log.debug("Imported OSM place: {} ({})", osmPlace.name(), osmPlace.externalId());

            } catch (Exception e) {
                log.warn("Failed to import OSM place '{}' ({}): {}",
                        osmPlace.name(), osmPlace.externalId(), e.getMessage());
                failed++;
            }
        }

        log.info("OSM import complete. Imported: {}, Skipped (duplicates): {}, Failed: {}",
                imported, skipped, failed);
        return new OsmImportResult(imported, skipped, failed, osmPlaces.size(),
                "Import complete", placeDataProvider.getProviderName(), true);
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    private void saveOsmPlace(OsmPlace osm) {
        org.locationtech.jts.geom.Point geom =
                geometryFactory.createPoint(new Coordinate(osm.longitude(), osm.latitude()));

        Place place = Place.builder()
                .name(osm.name())
                .description(osm.description())
                .category(osm.category().toUpperCase())
                .address(osm.address() != null ? osm.address() : buildFallbackAddress(osm))
                .city(osm.city())
                .state(osm.state())
                .postalCode(osm.postalCode())
                .country(osm.country() != null ? osm.country() : "India")
                .geom(geom)
                .phone(osm.phone())
                .website(osm.website())
                .isActive(true)
                .sourceName("OPEN_STREET_MAP")
                .externalSourceId(osm.externalId())
                .lastImportedAt(OffsetDateTime.now())
                .features(new ArrayList<>())
                .build();

        // Seed all accessibility features as UNKNOWN — these may later be filled by
        // community reports. We deliberately do NOT set any AVAILABLE or NOT_AVAILABLE
        // statuses from OSM tags, since OSM data does not reliably encode accessibility.
        for (FeatureType type : FeatureType.values()) {
            AccessibilityFeature feature = AccessibilityFeature.builder()
                    .place(place)
                    .featureType(type)
                    .status(FeatureStatus.UNKNOWN)
                    .build();
            place.getFeatures().add(feature);
        }

        placeRepository.save(place);
    }

    /**
     * Constructs a minimal human-readable address when the OSM element lacks
     * structured {@code addr:*} tags — using whatever location data is available.
     */
    private String buildFallbackAddress(OsmPlace osm) {
        List<String> parts = new ArrayList<>();
        if (osm.city() != null && !osm.city().isBlank()) parts.add(osm.city());
        if (osm.state() != null && !osm.state().isBlank()) parts.add(osm.state());
        if (parts.isEmpty()) parts.add("India");
        return String.join(", ", parts);
    }
}
