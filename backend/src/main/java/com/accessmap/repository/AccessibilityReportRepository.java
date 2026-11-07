package com.accessmap.repository;

import com.accessmap.entity.AccessibilityReport;
import com.accessmap.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccessibilityReportRepository extends JpaRepository<AccessibilityReport, UUID> {

    @Query("SELECT r FROM AccessibilityReport r JOIN FETCH r.place LEFT JOIN FETCH r.photos WHERE r.reportingUser.id = :userId ORDER BY r.createdAt DESC")
    List<AccessibilityReport> findAllByReportingUserIdWithDetails(@Param("userId") UUID userId);

    Page<AccessibilityReport> findAllByReportingUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<AccessibilityReport> findAllByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    Page<AccessibilityReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AccessibilityReport> findAllByPlaceIdOrderByCreatedAtDesc(UUID placeId);

    List<AccessibilityReport> findAllByPlaceIdAndIdNotOrderByCreatedAtDesc(UUID placeId, UUID reportId);

    @Query("SELECT r FROM AccessibilityReport r JOIN FETCH r.place JOIN FETCH r.reportingUser LEFT JOIN FETCH r.photos WHERE r.id = :id")
    Optional<AccessibilityReport> findByIdWithDetails(@Param("id") UUID id);

    long countByStatus(ReportStatus status);
}

