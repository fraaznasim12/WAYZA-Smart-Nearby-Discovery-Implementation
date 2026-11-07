package com.accessmap.dto;

public record FeatureDefinitionDto(
    String code,
    String category,
    String name,
    String description,
    String icon,
    int displayOrder
) {}

