package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity recording security and management audit logs for the AccessMap platform.
 *
 * <p>Maintains an immutable record of administrator actions including user activation,
 * role escalation, place modification, data import, and dispute resolutions.
 */
@Entity
@Table(name = "admin_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actor;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType; // 'USER', 'PLACE', 'REPORT', 'DISPUTE', 'CLAIM', 'IMPORT', 'SETTING'

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(name = "outcome", nullable = false, length = 50)
    @Builder.Default
    private String outcome = "SUCCESS"; // 'SUCCESS', 'FAILED', 'REVERTED'

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

