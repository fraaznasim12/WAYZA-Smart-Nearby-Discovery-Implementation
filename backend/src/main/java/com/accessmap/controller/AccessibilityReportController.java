package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.ReportCreateRequest;
import com.accessmap.dto.ReportPhotoDto;
import com.accessmap.dto.ReportResponseDto;
import com.accessmap.entity.User;
import com.accessmap.service.AccessibilityReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class AccessibilityReportController {

    private final AccessibilityReportService reportService;

    /**
     * Submit a community report with JSON payload (e.g. external photo links or pre-uploaded images).
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ReportResponseDto>> submitReportJson(
            @Valid @RequestBody ReportCreateRequest request,
            @AuthenticationPrincipal User user) {
        log.info("Received JSON report submission for place {} from user {}", request.getPlaceId(), user != null ? user.getEmail() : "anonymous");
        ReportResponseDto response = reportService.createReport(request, user, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * Submit a community report with multipart form data including attached photo files.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReportResponseDto>> submitReportMultipart(
            @Valid @RequestPart("report") ReportCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user) {
        log.info("Received multipart report submission for place {} with {} files from user {}",
                request.getPlaceId(), files != null ? files.size() : 0, user != null ? user.getEmail() : "anonymous");
        ReportResponseDto response = reportService.createReport(request, user, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * Upload an evidence photograph to an existing report.
     */
    @PostMapping(value = "/{reportId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReportPhotoDto>> uploadPhoto(
            @PathVariable UUID reportId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @AuthenticationPrincipal User user) {
        log.info("Uploading photo for report {} from user {}", reportId, user.getEmail());
        ReportPhotoDto photo = reportService.uploadPhotoToReport(reportId, user, file, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(photo));
    }

    /**
     * Retrieve all reports submitted by the authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ReportResponseDto>>> getMyReports(
            @AuthenticationPrincipal User user) {
        List<ReportResponseDto> reports = reportService.getMyReports(user);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    /**
     * Retrieve a specific report by ID (owner or admin only).
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponseDto>> getReportById(
            @PathVariable UUID reportId,
            @AuthenticationPrincipal User user) {
        ReportResponseDto report = reportService.getReportById(reportId, user);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }
}
