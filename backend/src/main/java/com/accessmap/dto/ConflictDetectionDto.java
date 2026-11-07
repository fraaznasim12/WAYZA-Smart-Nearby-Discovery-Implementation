package com.accessmap.dto;

import com.accessmap.entity.FeatureStatus;
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
public class ConflictDetectionDto {

    private UUID reportId;
    private UUID placeId;
    private String placeName;
    private String featureCode;

    // Existing verified status on the venue
    private FeatureStatus currentFeatureStatus;
    private OffsetDateTime currentLastVerifiedAt;

    // Potential duplicate reports for the same place/feature
    @Builder.Default
    private List<SimilarReportSummary> similarReports = new ArrayList<>();

    // Whether this report creates a direct conflict with verified data
    private boolean hasConflict;
    private String conflictDescription;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimilarReportSummary {
        private UUID id;
        private String title;
        private String status;
        private String submitterName;
        private OffsetDateTime createdAt;
        private int photosCount;
    }
}

