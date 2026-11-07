package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity representing a photograph attached as evidence to an accessibility report.
 */
@Entity
@Table(name = "report_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private AccessibilityReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_file_id")
    private MediaFile mediaFile;

    @Column(name = "photo_url", nullable = false, length = 1000)
    private String photoUrl;

    @Column(name = "object_key", length = 500)
    private String objectKey;

    @Column(name = "caption", length = 500)
    private String caption;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

