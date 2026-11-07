package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a community or venue dispute against accessibility records or moderation decisions.
 */
@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private AccessibilityReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id")
    private ObservationSubmission observation;

    @Column(name = "feature_code", length = 100)
    private String featureCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitting_user_id", nullable = false)
    private User submittingUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 100)
    private DisputeCategory category;

    @Column(name = "explanation", nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_reviewer_id")
    private User assignedReviewer;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedByUser;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "profile_corrected", nullable = false)
    @Builder.Default
    private boolean profileCorrected = false;

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DisputePhoto> photos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public void addPhoto(DisputePhoto photo) {
        photos.add(photo);
        photo.setDispute(this);
    }

    public void removePhoto(DisputePhoto photo) {
        photos.remove(photo);
        photo.setDispute(null);
    }
}

