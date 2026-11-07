package com.accessmap.dto;

import com.accessmap.entity.NotificationPreference;
import com.accessmap.entity.NotificationType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationPreferenceDto(
    UUID id,
    NotificationType type,
    String defaultTitle,
    String defaultSummary,
    boolean inAppEnabled,
    boolean emailEnabled,
    OffsetDateTime updatedAt
) {
    public static NotificationPreferenceDto fromEntity(NotificationPreference entity) {
        return new NotificationPreferenceDto(
            entity.getId(),
            entity.getType(),
            entity.getType().getDefaultTitle(),
            entity.getType().getDefaultSummary(),
            Boolean.TRUE.equals(entity.getInAppEnabled()),
            Boolean.TRUE.equals(entity.getEmailEnabled()),
            entity.getUpdatedAt()
        );
    }

    public static NotificationPreferenceDto defaultForType(NotificationType type) {
        return new NotificationPreferenceDto(
            null,
            type,
            type.getDefaultTitle(),
            type.getDefaultSummary(),
            true, // in-app enabled by default
            false, // email disabled by default
            null
        );
    }
}

