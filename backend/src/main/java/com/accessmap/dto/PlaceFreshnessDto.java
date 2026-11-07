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
public class PlaceFreshnessDto {

    private UUID placeId;
    private String placeName;
    private int freshnessThresholdDays;
    private int totalFeatures;
    private int freshCount;
    private int staleCount;
    private int unverifiedCount;

    @Builder.Default
    private List<FeatureFreshnessItem> features = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureFreshnessItem {
        private String featureCode;
        private String featureName;
        private FeatureStatus status;
        private OffsetDateTime lastVerifiedAt;
        private Long daysSinceVerification;
        private boolean isStale;
        private String freshnessRating; // 'FRESH' | 'AGING' | 'STALE' | 'NEVER_VERIFIED'
    }
}

