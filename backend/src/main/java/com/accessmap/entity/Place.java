package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA Entity representing a physical venue (hospital, college, transit hub, etc.).
 *
 * <p>The {@code geom} field is mapped as a {@link org.locationtech.jts.geom.Point}
 * via Hibernate Spatial. The PostGIS column type is {@code GEOMETRY(Point, 4326)},
 * where 4326 refers to the WGS84 coordinate system (standard GPS lat/lng).
 *
 * <p>All spatial proximity queries use PostGIS {@code ST_DWithin} against
 * the {@code idx_places_geom} GIST index defined in V1__initial_schema.sql.
 */
@Entity
@Table(name = "places")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "country", nullable = false)
    @Builder.Default
    private String country = "India";

    /**
     * PostGIS spatial Point geometry stored as WGS84 (SRID 4326).
     * Note: JTS Point stores X=longitude, Y=latitude.
     * Spatial proximity queries use ST_DWithin against this column.
     *
     * <p>columnDefinition is intentionally omitted — Hibernate Spatial maps
     * JTS Point to GEOMETRY(Point,4326) in PostgreSQL automatically via the
     * registered spatial type descriptor. This also allows H2 to use BLOB
     * in test environments without schema failures.
     */
    @Column(name = "geom", nullable = false)
    private org.locationtech.jts.geom.Point geom;

    @Column(name = "phone")
    private String phone;

    @Column(name = "website")
    private String website;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "source_name", nullable = false)
    @Builder.Default
    private String sourceName = "PLATFORM_SEED";

    @Column(name = "external_source_id")
    private String externalSourceId;

    @Column(name = "source_updated_at")
    private OffsetDateTime sourceUpdatedAt;

    @Column(name = "last_imported_at")
    private OffsetDateTime lastImportedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * One place has many accessibility feature records (one per feature type).
     * CascadeType.ALL ensures features are persisted/deleted with the parent Place.
     */
    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AccessibilityFeature> features = new ArrayList<>();

    public double getLatitude() {
        return geom != null ? geom.getY() : 0.0;
    }

    public double getLongitude() {
        return geom != null ? geom.getX() : 0.0;
    }
}

