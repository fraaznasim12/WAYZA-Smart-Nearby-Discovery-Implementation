package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.DisputeCreateRequest;
import com.accessmap.dto.DisputePhotoDto;
import com.accessmap.dto.DisputeResponseDto;
import com.accessmap.entity.User;
import com.accessmap.service.DisputeService;
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

/**
 * Controller exposing community dispute submission and user dispute tracking endpoints.
 */
@RestController
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
@Slf4j
public class DisputeController {

    private final DisputeService disputeService;

    /**
     * Submits a dispute with JSON payload and optional embedded photo URLs.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<DisputeResponseDto>> createDisputeJson(
            @Valid @RequestBody DisputeCreateRequest request,
            @AuthenticationPrincipal User user) {
        log.info("User {} submitting dispute for place {}", user.getEmail(), request.getPlaceId());
        DisputeResponseDto response = disputeService.createDispute(request, user, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * Submits a dispute with multipart form-data supporting direct camera/gallery photo uploads.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DisputeResponseDto>> createDisputeMultipart(
            @Valid @RequestPart("dispute") DisputeCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user) {
        log.info("User {} submitting multipart dispute for place {} with {} files",
                user.getEmail(), request.getPlaceId(), files != null ? files.size() : 0);
        DisputeResponseDto response = disputeService.createDispute(request, user, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * Attaches an individual photograph to an existing dispute.
     */
    @PostMapping(value = "/{disputeId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DisputePhotoDto>> uploadDisputePhoto(
            @PathVariable UUID disputeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @AuthenticationPrincipal User user) {
        log.info("User {} attaching photo to dispute {}", user.getEmail(), disputeId);
        DisputePhotoDto photo = disputeService.uploadPhotoToDispute(disputeId, user, file, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(photo));
    }

    /**
     * Retrieves all disputes submitted by the authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<DisputeResponseDto>>> getMyDisputes(
            @AuthenticationPrincipal User user) {
        List<DisputeResponseDto> disputes = disputeService.getMyDisputes(user);
        return ResponseEntity.ok(ApiResponse.ok(disputes));
    }

    /**
     * Retrieves details of a specific dispute.
     */
    @GetMapping("/{disputeId}")
    public ResponseEntity<ApiResponse<DisputeResponseDto>> getDisputeById(
            @PathVariable UUID disputeId,
            @AuthenticationPrincipal User user) {
        DisputeResponseDto dispute = disputeService.getDisputeById(disputeId, user);
        return ResponseEntity.ok(ApiResponse.ok(dispute));
    }
}

