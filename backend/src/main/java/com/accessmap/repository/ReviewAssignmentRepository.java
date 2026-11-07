package com.accessmap.repository;

import com.accessmap.entity.ReviewAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewAssignmentRepository extends JpaRepository<ReviewAssignment, UUID> {
    List<ReviewAssignment> findAllByAssignedToIdOrderByCreatedAtDesc(UUID userId);
    List<ReviewAssignment> findAllByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);
    Optional<ReviewAssignment> findFirstByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(String targetType, UUID targetId, String status);
}

