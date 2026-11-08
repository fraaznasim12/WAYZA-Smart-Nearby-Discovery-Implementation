package com.accessmap.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Admin-only request payload for approving or rejecting a community review.
 */
@Data
public class ReviewModerationRequest {

    @NotNull(message = "Action is required (APPROVED or REJECTED)")
    private String action; // "APPROVED" or "REJECTED"

    private String rejectionReason; // Required when action == REJECTED
}

