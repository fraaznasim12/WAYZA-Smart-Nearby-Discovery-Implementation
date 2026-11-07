package com.accessmap.dto;

import com.accessmap.entity.FeatureStatus;

import java.util.UUID;

public record ObservationItemDto(
    UUID id,
    String featureCode,
    FeatureStatus status,
    String notes
) {}

