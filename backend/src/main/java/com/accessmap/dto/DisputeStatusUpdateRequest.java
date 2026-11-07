package com.accessmap.dto;

import com.accessmap.entity.DisputeStatus;
import com.accessmap.entity.FeatureStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeStatusUpdateRequest {

    @NotNull(message = "New dispute status is required")
    private DisputeStatus status;

    private String resolutionNotes;

    /**
     * When UPHELD: whether to automatically correct the corresponding place accessibility feature.
     */
    private Boolean correctAccessibilityProfile;

    private String targetFeatureCode;

    private FeatureStatus targetFeatureStatus;
}

