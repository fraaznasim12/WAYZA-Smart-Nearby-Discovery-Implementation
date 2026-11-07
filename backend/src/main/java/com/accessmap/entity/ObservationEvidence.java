package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Photographic or document evidence attached to an accessibility observation submission.
 */
@Entity
@Table(name = "observation_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObservationEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private ObservationSubmission submission;

    @Column(name = "image_url", length = 1000, nullable = false)
    private String imageUrl;

    @Column(name = "caption", length = 255)
    private String caption;

    @Column(name = "feature_code", length = 60)
    private String featureCode;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;
}

