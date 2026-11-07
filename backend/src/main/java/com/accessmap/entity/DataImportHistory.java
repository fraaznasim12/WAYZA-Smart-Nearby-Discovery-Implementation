package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity tracking batch imports from external providers (e.g., OpenStreetMap).
 */
@Entity
@Table(name = "data_import_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataImportHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Column(name = "region_name", length = 100)
    private String regionName;

    @Column(name = "bounding_box", length = 100)
    private String boundingBox;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // 'COMPLETED', 'FAILED', 'PARTIAL'

    @Column(name = "records_imported", nullable = false)
    @Builder.Default
    private Integer recordsImported = 0;

    @Column(name = "records_skipped", nullable = false)
    @Builder.Default
    private Integer recordsSkipped = 0;

    @Column(name = "records_failed", nullable = false)
    @Builder.Default
    private Integer recordsFailed = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_user_id")
    private User initiatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

