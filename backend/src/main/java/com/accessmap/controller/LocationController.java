package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.location.CityDto;
import com.accessmap.dto.location.DistrictDto;
import com.accessmap.dto.location.LocationSuggestionDto;
import com.accessmap.dto.location.StateDto;
import com.accessmap.service.IndianLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing the authoritative Indian Administrative Directory.
 * Enables cascading location selection (State -> District -> City) and high-speed
 * debounced autocomplete with state and district disambiguation.
 */
@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {

    private final IndianLocationService locationService;

    /**
     * Retrieves all 36 Indian States and Union Territories.
     */
    @GetMapping("/states")
    public ResponseEntity<ApiResponse<List<StateDto>>> getStates() {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getAllStates()));
    }

    /**
     * Retrieves districts belonging to a specific state.
     */
    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<DistrictDto>>> getDistricts(
            @RequestParam String state
    ) {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getDistrictsByState(state)));
    }

    /**
     * Retrieves cities and towns, optionally filtered by state and district.
     */
    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<List<CityDto>>> getCities(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district
    ) {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getCities(state, district)));
    }

    /**
     * High-speed debounced autocomplete suggestion endpoint.
     * Matches query against States, Districts, and Cities, returning disambiguated labels.
     * Example: "Jam" -> "Jamshedpur (East Singhbhum, Jharkhand)".
     */
    @GetMapping("/suggest")
    public ResponseEntity<ApiResponse<List<LocationSuggestionDto>>> suggest(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.ok(locationService.suggestLocations(q, limit)));
    }
}

