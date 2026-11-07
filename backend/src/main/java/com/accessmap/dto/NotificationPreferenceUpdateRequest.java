package com.accessmap.dto;

import com.accessmap.entity.NotificationType;
import jakarta.validation.constraints.NotNull;

public record NotificationPreferenceUpdateRequest(
    @NotNull NotificationType type,
    boolean inAppEnabled,
    boolean emailEnabled
) {}

