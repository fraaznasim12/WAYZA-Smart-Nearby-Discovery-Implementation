package com.accessmap.service;

import com.accessmap.dto.AccessibilityFeatureDto;
import com.accessmap.dto.PlaceCreateRequest;
import com.accessmap.dto.PlaceDto;
import com.accessmap.entity.AccessibilityFeature;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import com.accessmap.entity.Place;
import com.accessmap.exception.BadRequestException;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.PlaceRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Service managing Place discovery, geographical search, and feature auditing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final org.springframework.core.env.Environment environment;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Value("${accessmap.verification.staleness-threshold-days:180}")
    private int stalenessThresholdDays;

    private static final double EARTH_RADIUS_METERS = 6371000.0;

    /**
     * Lists active venues with optional filters for name/keyword, category, and city.
     */
    @Transactional(readOnly = true)
    public Page<PlaceDto> getPlaces(String name, String category, String city, Pageable pageable) {
        return getPlaces(name, category, city, null, null, pageable);
    }

    /**
     * Lists active venues with optional filters for name/keyword, category, city, and required available features.
     */
    @Transactional(readOnly = true)
    public Page<PlaceDto> getPlaces(String name, String category, String city, List<String> requiredFeatures, Pageable pageable) {
        return getPlaces(name, category, city, null, requiredFeatures, pageable);
    }

    /**
     * Lists active venues with optional filters for name/keyword, category, city, state, and required available features.
     */
    @Transactional(readOnly = true)
    public Page<PlaceDto> getPlaces(String name, String category, String city, String state,
                                    List<String> requiredFeatures, Pageable pageable) {
        Specification<Place> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (name != null && !name.isBlank()) {
                String searchPattern = "%" + name.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("address")), searchPattern)
                ));
            }

            if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("category")), category.trim().toUpperCase()));
            }

            if (city != null && !city.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + city.trim().toLowerCase() + "%"));
            }

            if (state != null && !state.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("state")), "%" + state.trim().toLowerCase() + "%"));
            }

            if (requiredFeatures != null && !requiredFeatures.isEmpty()) {
                for (String featCode : requiredFeatures) {
                    if (featCode == null || featCode.isBlank()) continue;
                    FeatureType featType = FeatureType.fromCode(featCode);
                    if (featType != null) {
                        jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
                        jakarta.persistence.criteria.Root<AccessibilityFeature> featRoot = subquery.from(AccessibilityFeature.class);
                        subquery.select(featRoot.get("place").get("id"))
                                .where(
                                        cb.equal(featRoot.get("place"), root),
                                        cb.equal(featRoot.get("featureType"), featType),
                                        cb.equal(featRoot.get("status"), FeatureStatus.AVAILABLE)
                                );
                        predicates.add(cb.exists(subquery));
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return placeRepository.findAll(spec, pageable).map(p -> toDto(p, null));
    }

    /**
     * Viewport Search: returns active places whose geom falls within a map bounding box.
     * Uses PostGIS ST_MakeEnvelope in production; falls back to in-memory for dev/test profiles.
     */
    @Transactional(readOnly = true)
    public Page<PlaceDto> getPlacesInViewport(double south, double west, double north, double east,
                                               String category, Pageable pageable) {
        boolean isDevOrTest = environment != null &&
                (environment.matchesProfiles("dev") || environment.matchesProfiles("test"));

        if (isDevOrTest) {
            return findInViewportInMemoryFallback(south, west, north, east, category, pageable);
        }

        String cat = (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL"))
                ? category.trim().toUpperCase() : null;
        return placeRepository.findInViewport(west, south, east, north, cat, pageable)
                .map(p -> toDto(p, null));
    }

    /**
     * Bounding-box filter implemented in memory for dev/test environments (H2 without PostGIS).
     */
    private Page<PlaceDto> findInViewportInMemoryFallback(double south, double west, double north, double east,
                                                            String category, Pageable pageable) {
        List<Place> allActive = placeRepository.findAllByIsActiveTrue();
        List<Place> filtered = allActive.stream()
                .filter(p -> {
                    double lat = p.getLatitude();
                    double lng = p.getLongitude();
                    if (lat < south || lat > north || lng < west || lng > east) return false;
                    if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
                        return category.trim().equalsIgnoreCase(p.getCategory());
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Place::getName))
                .toList();

        int start = (int) pageable.getOffset();
        if (start >= filtered.size()) return new PageImpl<>(List.of(), pageable, filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end).stream()
                .map(p -> toDto(p, null)).toList(), pageable, filtered.size());
    }

    /**
     * PostGIS Spatial Search: Finds places within a radius in meters from GPS coordinates.
     */
    @Transactional(readOnly = true)
    public Page<PlaceDto> getNearbyPlaces(double latitude, double longitude, double radiusMeters, Pageable pageable) {
        return getNearbyPlaces(latitude, longitude, radiusMeters, null, pageable);
    }

    /**
     * PostGIS Spatial Search with optional category filter: Finds places within a radius in meters from GPS coordinates.
     */
    @Transactional(readOnly = true)
    public Page<PlaceDto> getNearbyPlaces(double latitude, double longitude, double radiusMeters, String category, Pageable pageable) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90 degrees");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180 degrees");
        }
        if (radiusMeters < 10.0 || radiusMeters > 50000.0) {
            throw new BadRequestException("Search radius must be between 10 and 50,000 meters");
        }

        boolean isDevOrTest = environment != null && (environment.matchesProfiles("dev") || environment.matchesProfiles("test"));
        Page<Place> places;
        if (isDevOrTest) {
            places = findNearbyInMemoryFallback(latitude, longitude, radiusMeters, category, pageable);
        } else {
            if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
                places = placeRepository.findNearbyWithCategory(longitude, latitude, radiusMeters, category.trim().toUpperCase(), pageable);
            } else {
                places = placeRepository.findNearby(longitude, latitude, radiusMeters, pageable);
            }
        }

        return places.map(p -> {
            double distance = calculateHaversineDistance(latitude, longitude, p.getLatitude(), p.getLongitude());
            return toDto(p, Math.round(distance * 10.0) / 10.0);
        });
    }

    /**
     * Fallback spatial search for environments without native PostGIS extensions (such as H2 in-memory test DB).
     */
    private Page<Place> findNearbyInMemoryFallback(double lat, double lng, double radiusMeters, String category, Pageable pageable) {
        List<Place> allActive = placeRepository.findAllByIsActiveTrue();
        List<Place> filtered = allActive.stream()
                .filter(p -> {
                    if (calculateHaversineDistance(lat, lng, p.getLatitude(), p.getLongitude()) > radiusMeters) {
                        return false;
                    }
                    if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
                        return category.trim().equalsIgnoreCase(p.getCategory());
                    }
                    return true;
                })
                .sorted(Comparator.comparingDouble(p -> calculateHaversineDistance(lat, lng, p.getLatitude(), p.getLongitude())))
                .toList();

        int start = (int) pageable.getOffset();
        if (start >= filtered.size()) {
            return new PageImpl<>(List.of(), pageable, filtered.size());
        }
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    /**
     * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
     */
    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    @Transactional(readOnly = true)
    public PlaceDto getPlaceById(UUID id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));
        return toDto(place, null);
    }

    @Transactional
    public PlaceDto createPlace(PlaceCreateRequest req) {
        Point point = geometryFactory.createPoint(new Coordinate(req.longitude(), req.latitude()));

        Place place = Place.builder()
                .name(req.name())
                .description(req.description())
                .category(req.category().toUpperCase())
                .address(req.address())
                .city(req.city())
                .state(req.state())
                .postalCode(req.postalCode())
                .country(req.country() != null ? req.country() : "India")
                .geom(point)
                .phone(req.phone())
                .website(req.website())
                .isActive(true)
                .features(new ArrayList<>())
                .build();

        // Initialize default un-audited features in UNKNOWN state
        for (FeatureType type : FeatureType.values()) {
            AccessibilityFeature feature = AccessibilityFeature.builder()
                    .place(place)
                    .featureType(type)
                    .status(FeatureStatus.UNKNOWN)
                    .build();
            place.getFeatures().add(feature);
        }

        Place saved = placeRepository.save(place);
        return toDto(saved, null);
    }

    public PlaceDto toDto(Place place, Double distanceMeters) {
        double lat = place.getLatitude();
        double lng = place.getLongitude();

        List<AccessibilityFeatureDto> featureDtos = place.getFeatures() != null
                ? place.getFeatures().stream()
                .map(f -> new AccessibilityFeatureDto(
                        f.getId(),
                        f.getFeatureType(),
                        computeEffectiveStatus(f),
                        f.getNotes(),
                        f.getLastVerifiedAt()
                ))
                .toList()
                : List.of();

        return new PlaceDto(
                place.getId(),
                place.getName(),
                place.getDescription(),
                place.getCategory(),
                place.getAddress(),
                place.getCity(),
                place.getState(),
                place.getPostalCode(),
                place.getCountry(),
                lat,
                lng,
                distanceMeters,
                place.getPhone(),
                place.getWebsite(),
                place.getIsActive(),
                place.getSourceName(),
                place.getExternalSourceId(),
                place.getLastImportedAt(),
                featureDtos,
                place.getCreatedAt(),
                place.getUpdatedAt()
        );
    }

    public FeatureStatus computeEffectiveStatus(AccessibilityFeature feature) {
        if (feature.getStatus() == FeatureStatus.UNKNOWN) {
            return FeatureStatus.UNKNOWN;
        }

        if (feature.getStatus() == FeatureStatus.NOT_VERIFIED) {
            return FeatureStatus.NOT_VERIFIED;
        }

        OffsetDateTime verifiedAt = feature.getLastVerifiedAt();
        if (verifiedAt == null) {
            return FeatureStatus.NOT_VERIFIED;
        }

        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(stalenessThresholdDays);
        if (verifiedAt.isBefore(cutoff)) {
            return FeatureStatus.NOT_VERIFIED;
        }

        return feature.getStatus();
    }
}
