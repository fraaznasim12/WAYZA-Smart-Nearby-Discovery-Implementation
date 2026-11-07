package com.accessmap.dto;

import com.accessmap.entity.Notification;
import com.accessmap.entity.NotificationType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    NotificationType type,
    String title,
    String message,
    String relatedEntityType,
    UUID relatedEntityId,
    Boolean isRead,
    OffsetDateTime createdAt,
    OffsetDateTime readAt,
    String metadata
) {
    public static NotificationDto fromEntity(Notification entity) {
        return new NotificationDto(
            entity.getId(),
            entity.getType(),
            entity.getTitle(),
            entity.getMessage(),
            entity.getRelatedEntityType(),
            entity.getRelatedEntityId(),
            entity.getIsRead(),
            entity.getCreatedAt(),
            entity.getReadAt(),
            entity.getMetadata()
        );
    }
}

