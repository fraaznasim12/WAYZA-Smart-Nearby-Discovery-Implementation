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
 * Master JPA Entity for an accessibility observation report submitted by a community member,
 * verified business owner, or administrator.
 *
 * <p>Implements the verification workflow:
 * <ul>
 *   <li>Starts as {@link ObservationVerificationStatus#PENDING}.</li>
 *   <li>Pending reports are clearly identified as unverified.</li>
 *   <li>Admins review evidence and approve or reject.</li>
 *   <li>Only approved submissions update the official {@link AccessibilityFeature} records.</li>
 *   <li>Rejected submissions retain full audit history.</li>
 * </ul>
 */
@Entity
@Table(name = "observation_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObservationSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_type", nullable = false)
    @Builder.Default
    private SubmissionType submissionType = SubmissionType.COMMUNITY;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private ObservationVerificationStatus verificationStatus = ObservationVerificationStatus.PENDING;

    @Column(name = "observation_date", nullable = false)
    @Builder.Default
    private OffsetDateTime observationDate = OffsetDateTime.now();

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ObservationSubmissionItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ObservationEvidence> evidence = new ArrayList<>();
}

