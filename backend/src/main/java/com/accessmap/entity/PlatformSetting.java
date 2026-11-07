package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity storing runtime configuration settings for the AccessMap platform.
 */
@Entity
@Table(name = "platform_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 500)
    private String value;

    @Column(name = "setting_group", nullable = false, length = 50)
    private String group;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;
}

