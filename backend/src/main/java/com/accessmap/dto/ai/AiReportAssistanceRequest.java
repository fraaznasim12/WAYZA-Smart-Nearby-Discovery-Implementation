package com.accessmap.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Request to assist a user in refining their community report before submission.
 */
public record AiReportAssistanceRequest(
    @NotBlank(message = "Draft description cannot be blank")
    @Size(max = 1000, message = "Draft description cannot exceed 1000 characters")
    String draftDescription,
    UUID placeId,
    String featureCode
) {}

