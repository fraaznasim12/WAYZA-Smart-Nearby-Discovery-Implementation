package com.accessmap.repository;

import com.accessmap.entity.ObservationSubmission;
import com.accessmap.entity.ObservationVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ObservationSubmissionRepository extends JpaRepository<ObservationSubmission, UUID> {

    List<ObservationSubmission> findAllByPlaceIdOrderByCreatedAtDesc(UUID placeId);

    List<ObservationSubmission> findAllBySubmittedByIdOrderByCreatedAtDesc(UUID userId);

    Page<ObservationSubmission> findAllByVerificationStatus(ObservationVerificationStatus status, Pageable pageable);

    long countByPlaceIdAndVerificationStatus(UUID placeId, ObservationVerificationStatus status);
}

