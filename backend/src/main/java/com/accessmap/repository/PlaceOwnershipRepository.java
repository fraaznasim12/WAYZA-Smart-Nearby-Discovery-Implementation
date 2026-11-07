package com.accessmap.repository;

import com.accessmap.entity.Place;
import com.accessmap.entity.PlaceOwnership;
import com.accessmap.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlaceOwnershipRepository extends JpaRepository<PlaceOwnership, UUID> {

    Optional<PlaceOwnership> findByPlaceAndUser(Place place, User user);

    Optional<PlaceOwnership> findByPlaceIdAndUserId(UUID placeId, UUID userId);

    boolean existsByPlaceIdAndUserIdAndIsVerifiedTrue(UUID placeId, UUID userId);

    List<PlaceOwnership> findAllByPlaceIdAndIsVerifiedTrue(UUID placeId);

    List<PlaceOwnership> findAllByUserId(UUID userId);

    List<PlaceOwnership> findAllByIsVerifiedFalse();

    Page<PlaceOwnership> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<PlaceOwnership> findAllByIsVerifiedOrderByCreatedAtDesc(Boolean isVerified, Pageable pageable);

    long countByIsVerifiedFalse();

    long countByIsVerifiedTrue();
}
