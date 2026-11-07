package com.accessmap.service;

import com.accessmap.dto.AdminPlaceSummaryDto;
import com.accessmap.dto.AdminPlaceUpdateRequest;
import com.accessmap.dto.DuplicatePlaceCandidateDto;
import com.accessmap.entity.Place;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.entity.User;
import com.accessmap.repository.AccessibilityFeatureRepository;
import com.accessmap.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminPlaceService {

    private final PlaceRepository placeRepository;
    private final AccessibilityFeatureRepository featureRepository;
    private final AdminAuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<AdminPlaceSummaryDto> getPlaces(String search, String category, String city, String state, Boolean isActive, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        String cleanCat = (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) ? category.trim() : null;
        String cleanCity = (city != null && !city.isBlank()) ? city.trim() : null;
        String cleanState = (state != null && !state.isBlank()) ? state.trim() : null;

        Page<Place> places = placeRepository.searchAdminPlaces(cleanSearch, cleanCat, cleanCity, cleanState, isActive, pageable);
        return places.map(this::mapToSummary);
    }

    @Transactional(readOnly = true)
    public AdminPlaceSummaryDto getPlaceDetails(UUID placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));
        return mapToSummary(place);
    }

    @Transactional
    public AdminPlaceSummaryDto updatePlaceStatus(UUID placeId, boolean isActive, String reason, User adminUser) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        place.setIsActive(isActive);
        Place saved = placeRepository.save(place);

        auditLogService.log(
                adminUser,
                isActive ? "ACTIVATE_PLACE" : "DEACTIVATE_PLACE",
                "PLACE",
                place.getId(),
                "SUCCESS",
                String.format("Place '%s' (%s) status set to isActive=%s. Reason: %s",
                        place.getName(), place.getId(), isActive, reason != null ? reason : "Administrative moderation")
        );

        return mapToSummary(saved);
    }

    @Transactional
    public AdminPlaceSummaryDto updatePlace(UUID placeId, AdminPlaceUpdateRequest request, User adminUser) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        place.setName(request.name().trim());
        if (request.description() != null) place.setDescription(request.description().trim());
        place.setCategory(request.category().trim().toUpperCase());
        place.setAddress(request.address().trim());
        if (request.city() != null) place.setCity(request.city().trim());
        if (request.state() != null) place.setState(request.state().trim());
        if (request.postalCode() != null) place.setPostalCode(request.postalCode().trim());
        if (request.phone() != null) place.setPhone(request.phone().trim());
        if (request.website() != null) place.setWebsite(request.website().trim());

        Place saved = placeRepository.save(place);

        auditLogService.log(
                adminUser,
                "UPDATE_PLACE_METADATA",
                "PLACE",
                place.getId(),
                "SUCCESS",
                String.format("Updated place '%s' metadata. Reason: %s",
                        saved.getName(), request.reason() != null ? request.reason() : "Metadata correction")
        );

        return mapToSummary(saved);
    }

    @Transactional(readOnly = true)
    public List<DuplicatePlaceCandidateDto> getDuplicateCandidates(UUID placeId) {
        Place original = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        // Detect candidates by name similarity or same city & category
        String namePrefix = original.getName().length() > 4 ? original.getName().substring(0, 4) : original.getName();
        List<Place> candidates = placeRepository.findDuplicateCandidates(
                original.getId(),
                namePrefix,
                original.getCity(),
                original.getCategory(),
                PageRequest.of(0, 10)
        );

        List<DuplicatePlaceCandidateDto> dtos = new ArrayList<>();
        double origLat = original.getGeom() != null ? original.getGeom().getY() : 0.0;
        double origLng = original.getGeom() != null ? original.getGeom().getX() : 0.0;

        for (Place c : candidates) {
            double cLat = c.getGeom() != null ? c.getGeom().getY() : 0.0;
            double cLng = c.getGeom() != null ? c.getGeom().getX() : 0.0;
            double dist = computeHaversineDistanceMeters(origLat, origLng, cLat, cLng);

            String reason;
            if (c.getName().equalsIgnoreCase(original.getName())) {
                reason = "Exact name match";
            } else if (dist < 200) {
                reason = String.format("Very close location (%.1f meters away)", dist);
            } else {
                reason = "Similar name and category in the same municipality";
            }

            dtos.add(new DuplicatePlaceCandidateDto(
                    original.getId(),
                    original.getName(),
                    c.getId(),
                    c.getName(),
                    c.getAddress(),
                    c.getCategory(),
                    cLat,
                    cLng,
                    dist,
                    reason
            ));
        }

        return dtos;
    }

    private AdminPlaceSummaryDto mapToSummary(Place place) {
        double lat = place.getGeom() != null ? place.getGeom().getY() : 0.0;
        double lng = place.getGeom() != null ? place.getGeom().getX() : 0.0;
        int verifiedCount = 0;
        try {
            verifiedCount = featureRepository.findAllByPlaceId(place.getId()).size();
        } catch (Exception e) {
            log.debug("Could not count verified features for place {}: {}", place.getId(), e.getMessage());
        }

        return new AdminPlaceSummaryDto(
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
                place.getIsActive(),
                place.getSourceName(),
                place.getExternalSourceId(),
                place.getPhone(),
                place.getWebsite(),
                place.getCreatedAt(),
                place.getLastImportedAt(),
                verifiedCount
        );
    }

    private double computeHaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        if (lat1 == 0 && lon1 == 0 || lat2 == 0 && lon2 == 0) return 0.0;
        double earthRadius = 6371000.0; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}

