package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Single feature assessment in a structured accessibility checklist submission.
 */
@Entity
@Table(
    name = "observation_submission_items",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_submission_feature",
        columnNames = {"submission_id", "feature_code"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObservationSubmissionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private ObservationSubmission submission;

    @Column(name = "feature_code", length = 60, nullable = false)
    private String featureCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private FeatureStatus status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}

