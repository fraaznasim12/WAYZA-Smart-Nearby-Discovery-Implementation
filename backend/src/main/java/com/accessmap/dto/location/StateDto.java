package com.accessmap.dto.location;

/**
 * Representation of an Indian State or Union Territory.
 */
public record StateDto(
    String code,
    String name,
    String type // 'STATE' or 'UNION_TERRITORY'
) {}

