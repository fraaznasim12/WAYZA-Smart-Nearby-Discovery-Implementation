package com.accessmap.repository;

import com.accessmap.entity.ModerationAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ModerationActionRepository extends JpaRepository<ModerationAction, UUID> {
    List<ModerationAction> findAllByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);
    List<ModerationAction> findTop50ByOrderByCreatedAtDesc();
}

