package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.PlaceCreateRequest;
import com.accessmap.dto.PlaceDto;
import com.accessmap.service.PlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller exposing venue discovery and accessibility information endpoints.
 */
@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    /**
     * Lists active venues with optional category filter and pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PlaceDto>>> getPlaces(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<PlaceDto> places = placeService.getPlaces(category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(places));
    }

    /**
     * PostGIS Spatial Search: Finds places within a radius from a GPS coordinate.
     *
     * @param lat          latitude (-90 to 90)
     * @param lng          longitude (-180 to 180)
     * @param radiusMeters radius buffer in meters (default: 2000m)
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<Page<PlaceDto>>> getNearbyPlaces(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "2000") double radiusMeters,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<PlaceDto> nearby = placeService.getNearbyPlaces(lat, lng, radiusMeters, pageable);
        return ResponseEntity.ok(ApiResponse.ok(nearby));
    }

    /**
     * Retrieves full accessibility details and audited features for a specific venue.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceDto>> getPlaceById(@PathVariable UUID id) {
        PlaceDto place = placeService.getPlaceById(id);
        return ResponseEntity.ok(ApiResponse.ok(place));
    }

    /**
     * Registers a new venue. Restricted to authenticated contributors, business owners, or admins.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CONTRIBUTOR', 'BUSINESS', 'ADMIN')")
    public ResponseEntity<ApiResponse<PlaceDto>> createPlace(@Valid @RequestBody PlaceCreateRequest req) {
        PlaceDto created = placeService.createPlace(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }
}

