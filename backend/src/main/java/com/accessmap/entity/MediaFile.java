package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity representing metadata for a file stored in object storage (MinIO / S3).
 *
 * <p>The actual file binary is <strong>never</strong> stored in the database.
 * Only the object key (path within the bucket) is persisted here, enabling
 * the backend to generate signed URLs or proxy-retrieve the file from storage.
 *
 * <h3>Purpose values</h3>
 * <ul>
 *   <li>{@code USER_AVATAR} — user profile photograph.</li>
 *   <li>{@code REPORT_EVIDENCE} — photograph attached to a community accessibility report.</li>
 * </ul>
 *
 * <h3>Visibility values</h3>
 * <ul>
 *   <li>{@code APPROVED} — visible to intended audiences. Avatars start here.</li>
 *   <li>{@code PENDING_REVIEW} — awaiting admin moderation. Report evidence starts here.</li>
 *   <li>{@code REJECTED} — rejected by a moderator; not served to users.</li>
 * </ul>
 */
@Entity
@Table(name = "media_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * The user who uploaded this file.
     * Cascade delete ensures files are cleaned up when a user is removed.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    /**
     * Purpose classification — {@code USER_AVATAR} or {@code REPORT_EVIDENCE}.
     */
    @Column(name = "purpose", nullable = false, length = 50)
    private String purpose;

    /**
     * Object key within the storage bucket.
     * Example: {@code "avatars/550e8400-e29b-41d4-a716-446655440000.webp"}
     * Generated as a random UUID to prevent path traversal and enumeration attacks.
     */
    @Column(name = "object_key", nullable = false, unique = true, length = 500)
    private String objectKey;

    /**
     * Name of the storage bucket. Stored to support multi-bucket routing in future.
     */
    @Column(name = "bucket_name", nullable = false, length = 200)
    private String bucketName;

    /**
     * MIME type as determined by Apache Tika content inspection —
     * never the browser-declared Content-Type header.
     */
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    /**
     * File size in bytes of the re-encoded image stored in object storage.
     */
    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    /**
     * SHA-256 hex digest of the stored file content for integrity verification.
     */
    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    /**
     * Moderation status.
     * {@code APPROVED} for avatars (immediate); {@code PENDING_REVIEW} for report evidence.
     */
    @Column(name = "visibility", nullable = false, length = 30)
    @Builder.Default
    private String visibility = "APPROVED";

    /**
     * Optional link to an accessibility observation submission.
     * Null for USER_AVATAR files.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private ObservationSubmission report;

    /**
     * Optional link to a community accessibility barrier report.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accessibility_report_id")
    private AccessibilityReport accessibilityReport;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}

