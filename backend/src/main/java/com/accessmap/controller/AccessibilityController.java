package com.accessmap.controller;

import com.accessmap.dto.*;
import com.accessmap.entity.User;
import com.accessmap.service.AccessibilityReportService;
import com.accessmap.service.AccessibilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AccessibilityController {

    private final AccessibilityService accessibilityService;
    private final AccessibilityReportService reportService;

    /**
     * Retrieves the standard accessibility feature catalogue.
     * Public endpoint.
     */
    @GetMapping({"/accessibility-features", "/accessibility/features"})
    public ResponseEntity<ApiResponse<List<FeatureDefinitionDto>>> getFeatureCatalog() {
        List<FeatureDefinitionDto> catalog = accessibilityService.getFeatureCatalog();
        return ResponseEntity.ok(ApiResponse.ok(catalog));
    }

    /**
     * Retrieves the comprehensive four-state accessibility profile for a venue.
     * Missing features default strictly to UNKNOWN.
     * Public endpoint.
     */
    @GetMapping("/places/{id}/accessibility")
    public ResponseEntity<ApiResponse<AccessibilityProfileDto>> getPlaceAccessibility(@PathVariable UUID id) {
        AccessibilityProfileDto profile = accessibilityService.getPlaceAccessibilityProfile(id);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    /**
     * Retrieves a lightweight accessibility summary for a venue.
     * Public endpoint.
     */
    @GetMapping("/places/{id}/accessibility/summary")
    public ResponseEntity<ApiResponse<AccessibilitySummaryDto>> getPlaceAccessibilitySummary(@PathVariable UUID id) {
        AccessibilitySummaryDto summary = accessibilityService.getPlaceAccessibilitySummary(id);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    /**
     * Retrieves verification freshness analysis for a venue without changing feature statuses.
     * Public endpoint.
     */
    @GetMapping("/places/{id}/freshness")
    public ResponseEntity<ApiResponse<PlaceFreshnessDto>> getPlaceFreshness(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "90") Integer thresholdDays) {
        PlaceFreshnessDto freshness = reportService.getPlaceFreshness(id, thresholdDays);
        return ResponseEntity.ok(ApiResponse.ok(freshness));
    }

    /**
     * Submits a structured community or business owner accessibility observation checklist.
     * Authenticated endpoint (ROLE_USER, ROLE_CONTRIBUTOR, ROLE_BUSINESS_OWNER, ROLE_ADMIN).
     * Begins in PENDING status.
     */
    @PostMapping({"/places/{id}/accessibility/observations", "/places/{id}/observations"})
    public ResponseEntity<ApiResponse<ObservationSubmissionDto>> submitObservation(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ObservationSubmitRequest request
    ) {
        ObservationSubmissionDto submission = accessibilityService.submitObservation(id, currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(submission));
    }

    /**
     * Uploads a photo evidence file for an accessibility observation.
     * Authenticated endpoint.
     */
    @PostMapping(value = "/places/{id}/accessibility/evidence/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ObservationEvidenceDto>> uploadEvidence(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "featureCode", required = false) String featureCode
    ) {
        ObservationEvidenceDto evidence = accessibilityService.uploadObservationEvidence(id, currentUser, file, caption, featureCode);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(evidence));
    }

    /**
     * Retrieves observation submissions made by the currently authenticated user.
     */
    @GetMapping("/accessibility/observations/me")
    public ResponseEntity<ApiResponse<List<ObservationSubmissionDto>>> getMyObservations(
            @AuthenticationPrincipal User currentUser
    ) {
        List<ObservationSubmissionDto> myObs = accessibilityService.getMyObservations(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(myObs));
    }

    /**
     * Lists observation audit history for a specific place.
     */
    @GetMapping("/places/{id}/observations")
    public ResponseEntity<ApiResponse<List<ObservationSubmissionDto>>> getPlaceObservations(@PathVariable UUID id) {
        List<ObservationSubmissionDto> observations = accessibilityService.getPlaceObservations(id);
        return ResponseEntity.ok(ApiResponse.ok(observations));
    }
}

