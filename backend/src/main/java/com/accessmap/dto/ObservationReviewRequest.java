package com.accessmap.dto;

import com.accessmap.entity.ObservationVerificationStatus;
import jakarta.validation.constraints.NotNull;

public record ObservationReviewRequest(
    @NotNull(message = "Review decision status is required (APPROVED or REJECTED)")
    ObservationVerificationStatus decision,

    String reviewNotes
) {}

