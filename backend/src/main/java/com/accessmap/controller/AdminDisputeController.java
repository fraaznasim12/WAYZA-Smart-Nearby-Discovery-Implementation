package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.DisputeResponseDto;
import com.accessmap.dto.DisputeStatusUpdateRequest;
import com.accessmap.entity.DisputeStatus;
import com.accessmap.entity.User;
import com.accessmap.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for administrator and moderator dispute management.
 */
@RestController
@RequestMapping("/api/v1/admin/disputes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminDisputeController {

    private final DisputeService disputeService;

    /**
     * Admin: Retrieves paginated disputes with optional status filter.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<DisputeResponseDto>>> getAdminDisputes(
            @RequestParam(value = "status", required = false) DisputeStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DisputeResponseDto> disputes = disputeService.getAdminDisputes(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(disputes));
    }

    /**
     * Admin: Retrieves full dispute details.
     */
    @GetMapping("/{disputeId}")
    public ResponseEntity<ApiResponse<DisputeResponseDto>> getAdminDisputeById(
            @PathVariable UUID disputeId,
            @AuthenticationPrincipal User admin) {
        DisputeResponseDto dispute = disputeService.getDisputeById(disputeId, admin);
        return ResponseEntity.ok(ApiResponse.ok(dispute));
    }

    /**
     * Admin: Updates dispute status (UPHELD, OVERTURNED, CLOSED, etc.) with resolution notes and optional profile correction.
     */
    @PatchMapping("/{disputeId}/status")
    public ResponseEntity<ApiResponse<DisputeResponseDto>> updateDisputeStatus(
            @PathVariable UUID disputeId,
            @Valid @RequestBody DisputeStatusUpdateRequest request,
            @AuthenticationPrincipal User admin) {
        log.info("Admin {} resolving dispute {} with status {}", admin.getEmail(), disputeId, request.getStatus());
        DisputeResponseDto updated = disputeService.updateDisputeStatus(disputeId, request, admin);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Admin: Assigns a dispute to a moderator for investigation.
     */
    @PostMapping("/{disputeId}/assign")
    public ResponseEntity<ApiResponse<DisputeResponseDto>> assignDispute(
            @PathVariable UUID disputeId,
            @RequestParam UUID reviewerId,
            @RequestParam(value = "notes", required = false) String notes,
            @AuthenticationPrincipal User admin) {
        log.info("Admin {} assigning dispute {} to reviewer {}", admin.getEmail(), disputeId, reviewerId);
        DisputeResponseDto updated = disputeService.assignDispute(disputeId, reviewerId, admin, notes);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}

