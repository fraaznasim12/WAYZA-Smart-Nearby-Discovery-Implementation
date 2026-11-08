package com.accessmap.service;

import com.accessmap.dto.CreatePlaceReviewRequest;
import com.accessmap.dto.PlaceReviewDto;
import com.accessmap.dto.ReviewModerationRequest;
import com.accessmap.entity.Place;
import com.accessmap.entity.PlaceReview;
import com.accessmap.entity.PlaceReview.ReviewStatus;
import com.accessmap.entity.User;
import com.accessmap.repository.PlaceRepository;
import com.accessmap.repository.PlaceReviewRepository;
import com.accessmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Service for community place reviews.
 *
 * <p>IMPORTANT: This service only manages community-submitted reviews.
 * It NEVER reads or modifies the independently verified accessibility profiles
 * stored in the {@code accessibility_features} tables.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceReviewService {

    private final PlaceReviewRepository reviewRepository;
    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Public Read
    // -------------------------------------------------------------------------

    /**
     * Returns approved reviews for a place, paginated.
     * Public endpoint — no authentication required.
     */
    @Transactional(readOnly = true)
    public Page<PlaceReviewDto> getApprovedReviews(UUID placeId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 20));
        return reviewRepository
                .findByPlaceIdAndStatusOrderByCreatedAtDesc(placeId, ReviewStatus.APPROVED, pageable)
                .map(this::toDto);
    }

    /**
     * Returns the authenticated user's own review for a place (if any).
     */
    @Transactional(readOnly = true)
    public PlaceReviewDto getMyReviewForPlace(UUID placeId) {
        User me = currentUser();
        return reviewRepository.findByPlaceIdAndUserId(placeId, me.getId())
                .map(this::toDto)
                .orElse(null);
    }

    // -------------------------------------------------------------------------
    // Write — Authenticated Users
    // -------------------------------------------------------------------------

    /**
     * Submits a new community review. Enforces the one-review-per-user-per-place rule.
     */
    @Transactional
    public PlaceReviewDto submitReview(UUID placeId, CreatePlaceReviewRequest request) {
        User me = currentUser();
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("Place not found: " + placeId));

        if (reviewRepository.existsByPlaceIdAndUserId(placeId, me.getId())) {
            throw new IllegalStateException(
                    "You have already submitted a review for this place. " +
                    "Only one review per place is allowed per user.");
        }

        PlaceReview review = PlaceReview.builder()
                .place(place)
                .user(me)
                .rating(request.getRating())
                .visitDate(request.getVisitDate())
                .reviewText(request.getReviewText())
                .accessibilitySummary(request.getAccessibilitySummary())
                .hadAccessibleEntrance(bool(request.getHadAccessibleEntrance()))
                .hadAccessibleRestroom(bool(request.getHadAccessibleRestroom()))
                .hadAccessibleParking(bool(request.getHadAccessibleParking()))
                .hadElevator(bool(request.getHadElevator()))
                .hadStepFreePath(bool(request.getHadStepFreePath()))
                .hadStaffAssistance(bool(request.getHadStaffAssistance()))
                .status(ReviewStatus.PENDING)
                .build();

        PlaceReview saved = reviewRepository.save(review);
        log.info("Community review {} submitted for place {} by user {}", saved.getId(), placeId, me.getId());
        return toDto(saved);
    }

    // -------------------------------------------------------------------------
    // Admin Moderation
    // -------------------------------------------------------------------------

    /**
     * Returns all pending reviews for the admin moderation queue.
     */
    @Transactional(readOnly = true)
    public Page<PlaceReviewDto> getPendingReviews(int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return reviewRepository.findByStatusOrderByCreatedAtAsc(ReviewStatus.PENDING, pageable)
                .map(this::toDto);
    }

    /**
     * Approves or rejects a review. Admin-only.
     */
    @Transactional
    public PlaceReviewDto moderateReview(UUID reviewId, ReviewModerationRequest request) {
        PlaceReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        User admin = currentUser();
        ReviewStatus newStatus = ReviewStatus.valueOf(request.getAction().toUpperCase());

        if (newStatus == ReviewStatus.REJECTED && (request.getRejectionReason() == null
                || request.getRejectionReason().isBlank())) {
            throw new IllegalArgumentException("A rejection reason is required when rejecting a review.");
        }

        review.setStatus(newStatus);
        review.setRejectionReason(request.getRejectionReason());
        review.setModeratedBy(admin);
        review.setModeratedAt(OffsetDateTime.now());

        PlaceReview updated = reviewRepository.save(review);
        log.info("Review {} {} by admin {}", reviewId, newStatus, admin.getId());
        return toDto(updated);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
    }

    private boolean bool(Boolean b) {
        return b != null && b;
    }

    private PlaceReviewDto toDto(PlaceReview r) {
        // Anonymise reviewer: show first name + last initial ("Fraaz N.")
        String reviewerName = "Community Member";
        if (r.getUser() != null) {
            String fullName = r.getUser().getFullName();
            if (fullName != null && !fullName.isBlank()) {
                String[] parts = fullName.trim().split("\\s+");
                if (parts.length >= 2) {
                    reviewerName = parts[0] + " " + parts[parts.length - 1].substring(0, 1).toUpperCase() + ".";
                } else {
                    reviewerName = parts[0];
                }
            }
        }

        return PlaceReviewDto.builder()
                .id(r.getId())
                .placeId(r.getPlace() != null ? r.getPlace().getId() : null)
                .placeName(r.getPlace() != null ? r.getPlace().getName() : null)
                .reviewerName(reviewerName)
                .rating(r.getRating())
                .visitDate(r.getVisitDate())
                .reviewText(r.getReviewText())
                .accessibilitySummary(r.getAccessibilitySummary())
                .hadAccessibleEntrance(r.getHadAccessibleEntrance())
                .hadAccessibleRestroom(r.getHadAccessibleRestroom())
                .hadAccessibleParking(r.getHadAccessibleParking())
                .hadElevator(r.getHadElevator())
                .hadStepFreePath(r.getHadStepFreePath())
                .hadStaffAssistance(r.getHadStaffAssistance())
                .status(r.getStatus())
                .rejectionReason(r.getRejectionReason())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
