package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity representing a community-submitted review for a place.
 *
 * <p>Community reviews carry a moderation lifecycle:
 * {@code PENDING} → {@code APPROVED} or {@code REJECTED}.
 *
 * <p>IMPORTANT: These reviews are community contributions and must NEVER
 * overwrite independently verified accessibility profiles.
 */
@Entity
@Table(name = "place_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceReview {

    public enum ReviewStatus {
        PENDING, APPROVED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // -------------------------------------------------------------------------
    // Core Review Content
    // -------------------------------------------------------------------------

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "visit_date")
    private LocalDate visitDate;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "accessibility_summary", columnDefinition = "TEXT")
    private String accessibilitySummary;

    // -------------------------------------------------------------------------
    // Structured Accessibility Flags
    // -------------------------------------------------------------------------

    @Column(name = "had_accessible_entrance")
    @Builder.Default
    private Boolean hadAccessibleEntrance = false;

    @Column(name = "had_accessible_restroom")
    @Builder.Default
    private Boolean hadAccessibleRestroom = false;

    @Column(name = "had_accessible_parking")
    @Builder.Default
    private Boolean hadAccessibleParking = false;

    @Column(name = "had_elevator")
    @Builder.Default
    private Boolean hadElevator = false;

    @Column(name = "had_step_free_path")
    @Builder.Default
    private Boolean hadStepFreePath = false;

    @Column(name = "had_staff_assistance")
    @Builder.Default
    private Boolean hadStaffAssistance = false;

    // -------------------------------------------------------------------------
    // Moderation
    // -------------------------------------------------------------------------

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by")
    private User moderatedBy;

    @Column(name = "moderated_at")
    private OffsetDateTime moderatedAt;

    // -------------------------------------------------------------------------
    // Timestamps
    // -------------------------------------------------------------------------

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}

