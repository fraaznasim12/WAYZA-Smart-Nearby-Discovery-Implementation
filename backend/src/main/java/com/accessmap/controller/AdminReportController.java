package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.ConflictDetectionDto;
import com.accessmap.dto.ReportResponseDto;
import com.accessmap.dto.ReportStatusUpdateRequest;
import com.accessmap.entity.ReportStatus;
import com.accessmap.entity.User;
import com.accessmap.service.AccessibilityReportService;
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

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final AccessibilityReportService reportService;

    /**
     * Admin: Retrieve paginated community accessibility reports with optional status filter.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponseDto>>> getAdminReports(
            @RequestParam(value = "status", required = false) ReportStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReportResponseDto> reports = reportService.getAdminReports(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    /**
     * Admin: Retrieve full details of an accessibility report.
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponseDto>> getAdminReportById(
            @PathVariable UUID reportId,
            @AuthenticationPrincipal User admin) {
        ReportResponseDto report = reportService.getReportById(reportId, admin);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    /**
     * Admin: Update moderation status of an accessibility report (IN_REVIEW, APPROVED, REJECTED, RESOLVED).
     */
    @PatchMapping("/{reportId}/status")
    public ResponseEntity<ApiResponse<ReportResponseDto>> updateReportStatus(
            @PathVariable UUID reportId,
            @Valid @RequestBody ReportStatusUpdateRequest request,
            @AuthenticationPrincipal User admin) {
        log.info("Admin {} updating report {} status to {}", admin.getEmail(), reportId, request.getStatus());
        ReportResponseDto updated = reportService.updateReportStatus(reportId, request, admin);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Admin: Assign a reviewer to an accessibility report.
     */
    @PostMapping("/{reportId}/assign")
    public ResponseEntity<ApiResponse<ReportResponseDto>> assignReport(
            @PathVariable UUID reportId,
            @RequestParam UUID reviewerId,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal User admin) {
        log.info("Admin {} assigning report {} to reviewer {}", admin.getEmail(), reportId, reviewerId);
        ReportResponseDto updated = reportService.assignReportReviewer(reportId, reviewerId, admin, notes);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Admin: Request additional information from report author.
     */
    @PostMapping("/{reportId}/request-info")
    public ResponseEntity<ApiResponse<ReportResponseDto>> requestInfo(
            @PathVariable UUID reportId,
            @RequestParam String notes,
            @AuthenticationPrincipal User admin) {
        log.info("Admin {} requesting more info on report {}", admin.getEmail(), reportId);
        ReportResponseDto updated = reportService.requestMoreInformation(reportId, notes, admin);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Admin: Detect potential duplicates and baseline conflicts for a report.
     */
    @GetMapping("/{reportId}/conflicts")
    public ResponseEntity<ApiResponse<ConflictDetectionDto>> detectConflicts(
            @PathVariable UUID reportId) {
        ConflictDetectionDto conflicts = reportService.detectConflicts(reportId);
        return ResponseEntity.ok(ApiResponse.ok(conflicts));
    }
}
