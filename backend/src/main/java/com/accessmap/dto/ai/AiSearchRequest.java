package com.accessmap.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Natural language place search query request.
 */
public record AiSearchRequest(
    @NotBlank(message = "Search query must not be blank")
    @Size(max = 1000, message = "Query cannot exceed 1000 characters")
    String query,
    Double latitude,
    Double longitude,
    Double radiusMeters
) {}

