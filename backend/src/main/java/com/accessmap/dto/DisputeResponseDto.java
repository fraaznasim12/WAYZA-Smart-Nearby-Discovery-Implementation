package com.accessmap.dto;

import com.accessmap.entity.DisputeCategory;
import com.accessmap.entity.DisputeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResponseDto {
    private UUID id;
    private UUID placeId;
    private String placeName;
    private String placeAddress;
    private UUID reportId;
    private String reportTitle;
    private UUID observationId;
    private String featureCode;
    private UUID submittingUserId;
    private String submittingUserName;
    private String submittingUserEmail;
    private DisputeCategory category;
    private String categoryDisplayName;
    private String explanation;
    private DisputeStatus status;
    private String assignedReviewerName;
    private String resolutionNotes;
    private String resolvedByName;
    private OffsetDateTime resolvedAt;
    private boolean profileCorrected;
    @Builder.Default
    private List<DisputePhotoDto> photos = new ArrayList<>();
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

