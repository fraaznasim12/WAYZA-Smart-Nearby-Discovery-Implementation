package com.accessmap.repository;

import com.accessmap.entity.DisputePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisputePhotoRepository extends JpaRepository<DisputePhoto, UUID> {
    List<DisputePhoto> findAllByDisputeIdOrderByCreatedAtAsc(UUID disputeId);
}

