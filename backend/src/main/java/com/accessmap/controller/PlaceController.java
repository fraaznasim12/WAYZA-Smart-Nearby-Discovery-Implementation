package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.PlaceCreateRequest;
import com.accessmap.dto.PlaceDto;
import com.accessmap.entity.User;
import com.accessmap.service.PlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller exposing venue discovery and geographical search endpoints.
 */
@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    /**
     * Lists active venues with optional search query (name/address), category, city, state, and pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PlaceDto>>> getPlaces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) java.util.List<String> features,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        String searchQuery = (q != null && !q.isBlank()) ? q : name;
        Page<PlaceDto> places = placeService.getPlaces(searchQuery, category, city, state, features, pageable);
        return ResponseEntity.ok(ApiResponse.ok(places));
    }

    /**
     * Viewport Search: returns active places within a geographic bounding box.
     * Uses PostGIS ST_MakeEnvelope in production; Haversine in-memory fallback in dev/test.
     *
     * @param north  maximum latitude
     * @param south  minimum latitude
     * @param east   maximum longitude
     * @param west   minimum longitude
     * @param category optional category filter
     */
    @GetMapping("/viewport")
    public ResponseEntity<ApiResponse<Page<PlaceDto>>> getPlacesInViewport(
            @RequestParam double north,
            @RequestParam double south,
            @RequestParam double east,
            @RequestParam double west,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Page<PlaceDto> places = placeService.getPlacesInViewport(south, west, north, east, category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(places));
    }

    /**
     * PostGIS Spatial Search: Finds places within a radius in meters from GPS coordinates.
     *
     * @param lat          latitude (-90 to 90)
     * @param lng          longitude (-180 to 180)
     * @param radiusMeters radius buffer in meters (default: 5000m)
     * @param category     optional category filter (e.g. HOSPITAL, RESTAURANT)
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<Page<PlaceDto>>> getNearbyPlaces(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") double radiusMeters,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<PlaceDto> nearby = placeService.getNearbyPlaces(lat, lng, radiusMeters, category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(nearby));
    }

    /**
     * Retrieves full details for a specific venue by UUID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceDto>> getPlaceById(@PathVariable UUID id) {
        PlaceDto place = placeService.getPlaceById(id);
        return ResponseEntity.ok(ApiResponse.ok(place));
    }

    /**
     * Registers a new venue. Restricted to authorized administrators.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlaceDto>> createPlace(@Valid @RequestBody PlaceCreateRequest req) {
        PlaceDto created = placeService.createPlace(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    /**
     * Suggests a new venue from community reporting.
     * Accessible to authenticated users; venue is registered in pending/inactive state until moderated.
     */
    @PostMapping("/suggest")
    public ResponseEntity<ApiResponse<PlaceDto>> suggestPlace(
            @Valid @RequestBody PlaceCreateRequest req,
            @AuthenticationPrincipal User user) {
        PlaceDto created = placeService.suggestPlace(req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }
}
