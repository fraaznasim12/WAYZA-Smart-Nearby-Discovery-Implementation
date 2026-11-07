package com.accessmap.repository;

import com.accessmap.entity.AccessibilityFeature;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccessibilityFeatureRepository extends JpaRepository<AccessibilityFeature, UUID> {

    List<AccessibilityFeature> findAllByPlaceId(UUID placeId);

    Optional<AccessibilityFeature> findByPlaceIdAndFeatureType(UUID placeId, FeatureType featureType);

    long countByStatus(FeatureStatus status);
}
