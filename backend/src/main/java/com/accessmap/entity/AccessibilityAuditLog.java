package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity recording every change to verified place accessibility features.
 *
 * <p>Maintains an immutable audit trail when administrators approve observations
 * or modify feature statuses, ensuring historical accountability.
 */
@Entity
@Table(name = "accessibility_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessibilityAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Column(name = "feature_code", nullable = false, length = 60)
    private String featureCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private FeatureStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private FeatureStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id")
    private ObservationSubmission observation;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

