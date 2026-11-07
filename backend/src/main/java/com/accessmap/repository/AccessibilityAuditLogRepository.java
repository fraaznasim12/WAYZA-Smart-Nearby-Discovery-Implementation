package com.accessmap.repository;

import com.accessmap.entity.AccessibilityAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for {@link AccessibilityAuditLog} entities.
 */
@Repository
public interface AccessibilityAuditLogRepository extends JpaRepository<AccessibilityAuditLog, UUID> {

    /** Finds audit log records for a given place ordered by creation time descending. */
    List<AccessibilityAuditLog> findByPlaceIdOrderByCreatedAtDesc(UUID placeId);

    /** Finds audit log records for a specific feature of a place. */
    List<AccessibilityAuditLog> findByPlaceIdAndFeatureCodeOrderByCreatedAtDesc(UUID placeId, String featureCode);
}

