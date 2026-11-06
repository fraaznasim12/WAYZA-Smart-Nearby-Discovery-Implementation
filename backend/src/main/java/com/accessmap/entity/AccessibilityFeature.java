package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity representing the accessibility status of a single physical feature
 * within a {@link Place}.
 *
 * <p>Each place has at most one {@code AccessibilityFeature} record per {@link FeatureType},
 * enforced by the database UNIQUE constraint: {@code CONSTRAINT uq_place_feature UNIQUE (place_id, feature_type)}.
 *
 * <p>The {@link FeatureStatus} field implements the Four-State Verification Model:
 * <ul>
 *   <li>{@code AVAILABLE} — Confirmed operational within 180 days.</li>
 *   <li>{@code NOT_AVAILABLE} — Confirmed absent or non-functional.</li>
 *   <li>{@code UNKNOWN} — No audit data yet. <strong>NEVER treated as NOT_AVAILABLE.</strong></li>
 *   <li>{@code NOT_VERIFIED} — Stale (> 180 days) or pending peer verification.</li>
 * </ul>
 */
@Entity
@Table(
    name = "accessibility_features",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_place_feature",
        columnNames = {"place_id", "feature_type"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessibilityFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Enumerated(EnumType.STRING)
    @Column(name = "feature_type", nullable = false)
    private FeatureType featureType;

    /**
     * The current four-state accessibility status of this feature.
     * Defaults to {@link FeatureStatus#UNKNOWN} for newly created places
     * with no field audits on record.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private FeatureStatus status = FeatureStatus.UNKNOWN;

    @Column(name = "notes")
    private String notes;

    @Column(name = "last_verified_at")
    private OffsetDateTime lastVerifiedAt;
}

