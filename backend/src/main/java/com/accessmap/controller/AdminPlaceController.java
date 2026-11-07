package com.accessmap.controller;

import com.accessmap.dto.AdminPlaceSummaryDto;
import com.accessmap.dto.AdminPlaceUpdateRequest;
import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.DuplicatePlaceCandidateDto;
import com.accessmap.entity.User;
import com.accessmap.service.AdminPlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/places")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminPlaceController {

    private final AdminPlaceService adminPlaceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminPlaceSummaryDto>>> getPlaces(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminPlaceSummaryDto> page = adminPlaceService.getPlaces(search, category, city, state, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPlaceSummaryDto>> getPlaceDetails(@PathVariable UUID id) {
        AdminPlaceSummaryDto place = adminPlaceService.getPlaceDetails(id);
        return ResponseEntity.ok(ApiResponse.ok(place));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminPlaceSummaryDto>> updatePlaceStatus(
            @PathVariable UUID id,
            @RequestParam boolean isActive,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} changing place {} status to isActive={}", adminUser.getEmail(), id, isActive);
        AdminPlaceSummaryDto updated = adminPlaceService.updatePlaceStatus(id, isActive, reason, adminUser);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPlaceSummaryDto>> updatePlace(
            @PathVariable UUID id,
            @Valid @RequestBody AdminPlaceUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} updating place {} metadata", adminUser.getEmail(), id);
        AdminPlaceSummaryDto updated = adminPlaceService.updatePlace(id, request, adminUser);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/{id}/duplicates")
    public ResponseEntity<ApiResponse<List<DuplicatePlaceCandidateDto>>> getDuplicateCandidates(@PathVariable UUID id) {
        List<DuplicatePlaceCandidateDto> candidates = adminPlaceService.getDuplicateCandidates(id);
        return ResponseEntity.ok(ApiResponse.ok(candidates));
    }
}

