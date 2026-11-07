package com.accessmap.dto;

import com.accessmap.entity.FeatureStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ObservationItemSubmitRequest(
    @NotBlank(message = "Feature code is required")
    String featureCode,

    @NotNull(message = "Feature status is required")
    FeatureStatus status,

    String notes
) {}

