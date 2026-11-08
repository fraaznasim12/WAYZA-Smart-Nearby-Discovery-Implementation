package com.accessmap.repository;

import com.accessmap.entity.PlaceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for community place reviews.
 */
public interface PlaceReviewRepository extends JpaRepository<PlaceReview, UUID> {

    /**
     * Returns approved reviews for a place, most recent first.
     */
    Page<PlaceReview> findByPlaceIdAndStatusOrderByCreatedAtDesc(
            UUID placeId,
            PlaceReview.ReviewStatus status,
            Pageable pageable
    );

    /**
     * Returns all reviews for a place (admin moderation queue), most recent first.
     */
    Page<PlaceReview> findByPlaceIdOrderByCreatedAtDesc(UUID placeId, Pageable pageable);

    /**
     * Returns all PENDING reviews (admin moderation queue), oldest first.
     */
    Page<PlaceReview> findByStatusOrderByCreatedAtAsc(PlaceReview.ReviewStatus status, Pageable pageable);

    /**
     * Returns the authenticated user's own review for a specific place (if any).
     */
    Optional<PlaceReview> findByPlaceIdAndUserId(UUID placeId, UUID userId);

    /**
     * Whether a user has already reviewed a place (enforces 1-review-per-user constraint).
     */
    boolean existsByPlaceIdAndUserId(UUID placeId, UUID userId);

    /**
     * Counts approved reviews for a place.
     */
    long countByPlaceIdAndStatus(UUID placeId, PlaceReview.ReviewStatus status);

    /**
     * Calculates the average rating of APPROVED reviews for a place.
     */
    @Query("SELECT AVG(r.rating) FROM PlaceReview r WHERE r.place.id = :placeId AND r.status = 'APPROVED'")
    Optional<Double> findAverageApprovedRatingByPlaceId(@Param("placeId") UUID placeId);
}

