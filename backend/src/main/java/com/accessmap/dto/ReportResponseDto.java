package com.accessmap.dto;

import com.accessmap.entity.ReportCategory;
import com.accessmap.entity.ReportStatus;
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
public class ReportResponseDto {
    private UUID id;
    private UUID placeId;
    private String placeName;
    private String placeAddress;
    private UUID reportingUserId;
    private String reportingUserName;
    private String reportingUserEmail;
    private ReportCategory category;
    private String categoryDisplayName;
    private String issueType;
    private String title;
    private String description;
    private OffsetDateTime observationDate;
    private Double latitude;
    private Double longitude;
    private ReportStatus status;
    private String adminNotes;
    private String rejectionReason;
    private OffsetDateTime infoRequestedAt;
    private String assignedReviewerName;
    private String reviewedByName;
    private OffsetDateTime reviewedAt;
    private OffsetDateTime resolvedAt;
    private boolean profileUpdated;
    @Builder.Default
    private List<ReportPhotoDto> photos = new ArrayList<>();
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

