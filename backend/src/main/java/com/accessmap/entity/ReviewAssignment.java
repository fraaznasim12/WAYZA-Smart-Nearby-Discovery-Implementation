package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Tracks assignment of moderation and review tasks to specific administrators/moderators.
 */
@Entity
@Table(name = "review_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // 'REPORT' | 'DISPUTE' | 'OBSERVATION'

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id", nullable = false)
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id", nullable = false)
    private User assignedBy;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "ASSIGNED"; // 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}

