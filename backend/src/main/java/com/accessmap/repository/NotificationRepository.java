package com.accessmap.repository;

import com.accessmap.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findAllByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<Notification> findAllByRecipientIdAndIsReadOrderByCreatedAtDesc(UUID recipientId, Boolean isRead, Pageable pageable);

    long countByRecipientIdAndIsReadFalse(UUID recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllAsRead(@Param("recipientId") UUID recipientId, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") OffsetDateTime cutoff);
}

