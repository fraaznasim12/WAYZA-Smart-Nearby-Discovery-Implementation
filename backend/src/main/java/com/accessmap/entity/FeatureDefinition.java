package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/**
 * JPA Entity representing a standardized accessibility feature definition in the catalogue.
 *
 * <p>Allows accessibility features to be managed dynamically in the database without
 * requiring application code rebuilds.
 */
@Entity
@Table(name = "feature_definitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureDefinition {

    @Id
    @Column(name = "code", length = 60, nullable = false, updatable = false)
    private String code;

    @Column(name = "category", length = 50, nullable = false)
    private String category;

    @Column(name = "name", length = 150, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}

