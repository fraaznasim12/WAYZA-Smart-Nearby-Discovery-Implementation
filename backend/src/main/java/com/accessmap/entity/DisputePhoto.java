package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Supporting photograph attached to an accessibility dispute.
 */
@Entity
@Table(name = "dispute_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

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

