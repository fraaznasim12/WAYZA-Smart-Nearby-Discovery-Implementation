package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.CreatePlaceReviewRequest;
import com.accessmap.dto.PlaceReviewDto;
import com.accessmap.dto.ReviewModerationRequest;
import com.accessmap.service.PlaceReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for community place reviews.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code GET  /api/v1/places/{id}/reviews}        — public: approved reviews for a place</li>
 *   <li>{@code POST /api/v1/places/{id}/reviews}        — authenticated: submit a review</li>
 *   <li>{@code GET  /api/v1/places/{id}/reviews/mine}   — authenticated: get own review for a place</li>
 *   <li>{@code GET  /api/v1/admin/reviews/pending}      — admin: moderation queue</li>
 *   <li>{@code PUT  /api/v1/admin/reviews/{id}/status}  — admin: approve or reject a review</li>
 * </ul>
 */
@RestController
@RequiredArgsConstructor
public class PlaceReviewController {

    private final PlaceReviewService reviewService;

    // -------------------------------------------------------------------------
    // Public Read
    // -------------------------------------------------------------------------

    @GetMapping("/api/v1/places/{placeId}/reviews")
    public ResponseEntity<ApiResponse<Page<PlaceReviewDto>>> getApprovedReviews(
            @PathVariable UUID placeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<PlaceReviewDto> results = reviewService.getApprovedReviews(placeId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    // -------------------------------------------------------------------------
    // Authenticated User Endpoints
    // -------------------------------------------------------------------------

    @PostMapping("/api/v1/places/{placeId}/reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PlaceReviewDto>> submitReview(
            @PathVariable UUID placeId,
            @Valid @RequestBody CreatePlaceReviewRequest request
    ) {
        PlaceReviewDto created = reviewService.submitReview(placeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @GetMapping("/api/v1/places/{placeId}/reviews/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PlaceReviewDto>> getMyReview(@PathVariable UUID placeId) {
        PlaceReviewDto review = reviewService.getMyReviewForPlace(placeId);
        return ResponseEntity.ok(ApiResponse.ok(review));
    }

    // -------------------------------------------------------------------------
    // Admin Moderation Endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/v1/admin/reviews/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PlaceReviewDto>>> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<PlaceReviewDto> results = reviewService.getPendingReviews(page, size);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @PutMapping("/api/v1/admin/reviews/{reviewId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlaceReviewDto>> moderateReview(
            @PathVariable UUID reviewId,
            @Valid @RequestBody ReviewModerationRequest request
    ) {
        PlaceReviewDto updated = reviewService.moderateReview(reviewId, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
