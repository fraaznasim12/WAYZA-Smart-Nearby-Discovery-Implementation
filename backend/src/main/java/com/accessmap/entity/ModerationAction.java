package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Immutable audit trail of every moderation decision, assignment, and status transition.
 */
@Entity
@Table(name = "moderation_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // 'REPORT' | 'DISPUTE' | 'OBSERVATION' | 'FEATURE'

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actor;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

