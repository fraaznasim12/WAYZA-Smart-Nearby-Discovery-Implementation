package com.accessmap.controller;

import com.accessmap.dto.*;
import com.accessmap.entity.ObservationVerificationStatus;
import com.accessmap.entity.User;
import com.accessmap.service.AccessibilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminObservationController {

    private final AccessibilityService accessibilityService;

    /**
     * Lists observation submissions for moderation review, optionally filtered by status.
     */
    @GetMapping({"/accessibility/observations", "/observations"})
    public ResponseEntity<ApiResponse<Page<ObservationSubmissionDto>>> getObservations(
            @RequestParam(required = false) ObservationVerificationStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<ObservationSubmissionDto> page = accessibilityService.getAdminObservations(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    /**
     * Approves an observation checklist submission and updates official place features.
     */
    @PostMapping({"/accessibility/observations/{id}/approve", "/observations/{id}/approve"})
    public ResponseEntity<ApiResponse<ObservationSubmissionDto>> approveObservation(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            @RequestParam(required = false, defaultValue = "Approved by administrator") String notes
    ) {
        ObservationSubmissionDto approved = accessibilityService.approveObservation(id, adminUser, notes);
        return ResponseEntity.ok(ApiResponse.ok(approved));
    }

    /**
     * Rejects an observation checklist submission.
     */
    @PostMapping({"/accessibility/observations/{id}/reject", "/observations/{id}/reject"})
    public ResponseEntity<ApiResponse<ObservationSubmissionDto>> rejectObservation(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            @RequestParam(required = false, defaultValue = "Rejected by administrator") String notes
    ) {
        ObservationSubmissionDto rejected = accessibilityService.rejectObservation(id, adminUser, notes);
        return ResponseEntity.ok(ApiResponse.ok(rejected));
    }

    /**
     * Approves or rejects a submitted observation checklist with explicit review payload.
     * Approving updates the place's official AccessibilityFeature records.
     */
    @PostMapping("/observations/{id}/review")
    public ResponseEntity<ApiResponse<ObservationSubmissionDto>> reviewObservation(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            @Valid @RequestBody ObservationReviewRequest request
    ) {
        ObservationSubmissionDto reviewed = accessibilityService.reviewObservation(id, adminUser, request);
        return ResponseEntity.ok(ApiResponse.ok(reviewed));
    }

    /**
     * Verifies or revokes business ownership claim on a venue.
     */
    @PostMapping("/ownerships/{id}/verify")
    public ResponseEntity<ApiResponse<PlaceOwnershipDto>> verifyOwnership(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            @RequestParam(defaultValue = "true") boolean approved
    ) {
        PlaceOwnershipDto ownership = accessibilityService.verifyPlaceOwnership(id, adminUser, approved);
        return ResponseEntity.ok(ApiResponse.ok(ownership));
    }
}

