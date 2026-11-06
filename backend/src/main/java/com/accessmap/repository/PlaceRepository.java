package com.accessmap.repository;

import com.accessmap.entity.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA Repository for {@link Place} entities.
 *
 * <p>Extends {@link JpaRepository} to inherit standard CRUD and pagination operations.
 * Custom PostGIS spatial proximity queries are defined using native SQL with
 * parameterized inputs (preventing spatial SQL injection).
 */
@Repository
public interface PlaceRepository extends JpaRepository<Place, UUID> {

    /**
     * Finds all active places within a given radius from a geographic coordinate.
     *
     * <p>Uses PostGIS {@code ST_DWithin} with the {@code ::geography} cast to
     * calculate accurate spherical distances in meters (not degrees), leveraging
     * the {@code idx_places_geom} GIST spatial index for sub-50ms execution.
     *
     * <p>Results are ordered by distance ascending (nearest first).
     *
     * @param longitude the center longitude (WGS84, X axis)
     * @param latitude  the center latitude (WGS84, Y axis)
     * @param radiusMeters the search radius in meters
     * @param pageable  pagination and sorting parameters
     * @return a paginated list of places within the radius, ordered nearest-first
     */
    @Query(value = """
        SELECT p.*
        FROM places p
        WHERE p.is_active = true
          AND ST_DWithin(
                p.geom::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radiusMeters
              )
        ORDER BY ST_Distance(
                p.geom::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
              ) ASC
        """,
        countQuery = """
        SELECT COUNT(*) FROM places p
        WHERE p.is_active = true
          AND ST_DWithin(
                p.geom::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radiusMeters
              )
        """,
        nativeQuery = true)
    Page<Place> findNearby(
        @Param("lng") double longitude,
        @Param("lat") double latitude,
        @Param("radiusMeters") double radiusMeters,
        Pageable pageable
    );

    /**
     * Finds all active places filtered by venue category with pagination.
     *
     * @param category the venue category (e.g., "HOSPITAL", "COLLEGE")
     * @param pageable pagination parameters
     * @return paginated places matching the category
     */
    Page<Place> findByIsActiveTrueAndCategoryIgnoreCase(String category, Pageable pageable);

    /**
     * Finds all active places with pagination (no category filter).
     *
     * @param pageable pagination parameters
     * @return paginated active places
     */
    Page<Place> findByIsActiveTrue(Pageable pageable);
}

