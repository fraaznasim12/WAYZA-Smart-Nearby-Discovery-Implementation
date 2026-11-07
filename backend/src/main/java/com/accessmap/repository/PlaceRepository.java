package com.accessmap.repository;

import com.accessmap.entity.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for {@link Place} entities.
 */
@Repository
public interface PlaceRepository extends JpaRepository<Place, UUID>, JpaSpecificationExecutor<Place> {

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

    @Query(value = """
        SELECT p.*
        FROM places p
        WHERE p.is_active = true
          AND ST_DWithin(
                p.geom::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radiusMeters
              )
          AND (:category IS NULL OR UPPER(p.category) = UPPER(:category))
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
          AND (:category IS NULL OR UPPER(p.category) = UPPER(:category))
        """,
        nativeQuery = true)
    Page<Place> findNearbyWithCategory(
        @Param("lng") double longitude,
        @Param("lat") double latitude,
        @Param("radiusMeters") double radiusMeters,
        @Param("category") String category,
        Pageable pageable
    );

    @Query(value = """
        SELECT p.*
        FROM places p
        WHERE p.is_active = true
          AND p.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
          AND (:category IS NULL OR UPPER(p.category) = UPPER(:category))
        ORDER BY p.name ASC
        """,
        countQuery = """
        SELECT COUNT(*) FROM places p
        WHERE p.is_active = true
          AND p.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
          AND (:category IS NULL OR UPPER(p.category) = UPPER(:category))
        """,
        nativeQuery = true)
    Page<Place> findInViewport(
        @Param("west") double west,
        @Param("south") double south,
        @Param("east") double east,
        @Param("north") double north,
        @Param("category") String category,
        Pageable pageable
    );

    Page<Place> findByIsActive(Boolean isActive, Pageable pageable);

    List<Place> findAllByIsActiveTrue();

    Optional<Place> findByExternalSourceId(String externalSourceId);

    boolean existsByExternalSourceId(String externalSourceId);

    long countByIsActiveTrue();

    @Query("SELECT p.category, COUNT(p) FROM Place p GROUP BY p.category")
    List<Object[]> countGroupByCategory();

    @Query("SELECT p.state, COUNT(p) FROM Place p WHERE p.state IS NOT NULL GROUP BY p.state")
    List<Object[]> countGroupByState();

    @Query("SELECT p FROM Place p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.address) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR UPPER(p.category) = UPPER(:category)) AND " +
           "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:state IS NULL OR LOWER(p.state) LIKE LOWER(CONCAT('%', :state, '%'))) AND " +
           "(:isActive IS NULL OR p.isActive = :isActive) " +
           "ORDER BY p.createdAt DESC")
    Page<Place> searchAdminPlaces(
            @Param("search") String search,
            @Param("category") String category,
            @Param("city") String city,
            @Param("state") String state,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query("SELECT p FROM Place p WHERE p.id <> :placeId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :namePrefix, '%')) OR " +
           "(p.city = :city AND p.category = :category)) " +
           "ORDER BY p.name ASC")
    List<Place> findDuplicateCandidates(
            @Param("placeId") UUID placeId,
            @Param("namePrefix") String namePrefix,
            @Param("city") String city,
            @Param("category") String category,
            Pageable pageable
    );
}
