package com.accessmap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ObservationEvidenceSubmitRequest(
    @NotBlank(message = "Image URL is required")
    @Pattern(
        regexp = "^(https?://.+|data:image/.+)",
        message = "Image URL must be a valid HTTP/HTTPS URL or image data URI"
    )
    String imageUrl,

    String caption,
    String featureCode
) {}

