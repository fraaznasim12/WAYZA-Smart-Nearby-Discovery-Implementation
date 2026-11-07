package com.accessmap.dto;

import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportStatusUpdateRequest {

    @NotNull(message = "New report status is required")
    private ReportStatus status;

    private String adminNotes;

    /**
     * Mandatory when status is REJECTED.
     */
    private String rejectionReason;

    /**
     * Optional: When true, updating status to APPROVED allows updating
     * the underlying place's accessibility feature profile directly from evidence.
     */
    private Boolean updateAccessibilityFeature;

    /**
     * Standardized feature code (e.g. "WHEELCHAIR_ACCESSIBLE_ENTRANCE", "ELEVATOR_AVAILABILITY")
     */
    private String featureCode;

    /**
     * Target accessibility status (e.g. "NOT_AVAILABLE" if elevator is broken, or "AVAILABLE" if resolved)
     */
    private FeatureStatus featureStatus;
}

