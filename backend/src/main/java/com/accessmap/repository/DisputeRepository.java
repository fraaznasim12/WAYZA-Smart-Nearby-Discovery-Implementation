package com.accessmap.repository;

import com.accessmap.entity.Dispute;
import com.accessmap.entity.DisputeStatus;
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
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    @Query("SELECT d FROM Dispute d JOIN FETCH d.place LEFT JOIN FETCH d.photos WHERE d.submittingUser.id = :userId ORDER BY d.createdAt DESC")
    List<Dispute> findAllBySubmittingUserIdWithDetails(@Param("userId") UUID userId);

    Page<Dispute> findAllBySubmittingUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Dispute> findAllByStatusOrderByCreatedAtDesc(DisputeStatus status, Pageable pageable);

    Page<Dispute> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT d FROM Dispute d JOIN FETCH d.place JOIN FETCH d.submittingUser LEFT JOIN FETCH d.photos WHERE d.id = :id")
    Optional<Dispute> findByIdWithDetails(@Param("id") UUID id);

    List<Dispute> findAllByPlaceIdOrderByCreatedAtDesc(UUID placeId);

    List<Dispute> findAllByReportId(UUID reportId);

    long countByStatus(DisputeStatus status);

    boolean existsByPlaceIdAndFeatureCodeAndStatusIn(UUID placeId, String featureCode, List<DisputeStatus> statuses);
}

