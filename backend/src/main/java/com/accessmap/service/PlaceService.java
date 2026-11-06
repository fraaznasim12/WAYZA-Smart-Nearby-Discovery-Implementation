package com.accessmap.service;

import com.accessmap.dto.AccessibilityFeatureDto;
import com.accessmap.dto.PlaceCreateRequest;
import com.accessmap.dto.PlaceDto;
import com.accessmap.entity.AccessibilityFeature;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import com.accessmap.entity.Place;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service managing Place discovery, feature auditing, and staleness calculations.
 */
@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Value("${accessmap.verification.staleness-threshold-days:180}")
    private int stalenessThresholdDays;

    @Transactional(readOnly = true)
    public Page<PlaceDto> getPlaces(String category, Pageable pageable) {
        Page<Place> places;
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            places = placeRepository.findByIsActiveTrueAndCategoryIgnoreCase(category, pageable);
        } else {
            places = placeRepository.findByIsActiveTrue(pageable);
        }
        return places.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<PlaceDto> getNearbyPlaces(double latitude, double longitude, double radiusMeters, Pageable pageable) {
        // Enforce maximum search radius of 50km
        double safeRadius = Math.min(Math.max(radiusMeters, 100), 50000);
        return placeRepository.findNearby(longitude, latitude, safeRadius, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public PlaceDto getPlaceById(UUID id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));
        return toDto(place);
    }

    @Transactional
    public PlaceDto createPlace(PlaceCreateRequest req) {
        Point point = geometryFactory.createPoint(new Coordinate(req.longitude(), req.latitude()));

        Place place = Place.builder()
                .name(req.name())
                .category(req.category().toUpperCase())
                .address(req.address())
                .city(req.city())
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
        return toDto(saved);
    }

    /**
     * Converts a JPA Place entity to an API PlaceDto, applying the
     * 180-day staleness calculation engine to all features.
     */
    public PlaceDto toDto(Place place) {
        double lat = place.getGeom() != null ? place.getGeom().getY() : 0.0;
        double lng = place.getGeom() != null ? place.getGeom().getX() : 0.0;

        List<AccessibilityFeatureDto> featureDtos = place.getFeatures().stream()
                .map(f -> new AccessibilityFeatureDto(
                        f.getId(),
                        f.getFeatureType(),
                        computeEffectiveStatus(f),
                        f.getNotes(),
                        f.getLastVerifiedAt()
                ))
                .toList();

        return new PlaceDto(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getAddress(),
                place.getCity(),
                lat,
                lng,
                featureDtos,
                place.getCreatedAt(),
                place.getUpdatedAt()
        );
    }

    /**
     * Four-State Staleness Calculation Engine:
     * - If a feature was verified as AVAILABLE or NOT_AVAILABLE, but the last verification
     *   is older than 180 days, it is computed and returned as NOT_VERIFIED.
     * - UNKNOWN status is ALWAYS preserved as UNKNOWN (Rule 8: Unknown is never assumed Not Available).
     */
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

