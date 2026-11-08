package com.accessmap.dto;

import com.accessmap.entity.PlaceReview.ReviewStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO representing a community review returned from the API.
 * Labelled "Community submitted — not independently verified."
 */
@Data
@Builder
public class PlaceReviewDto {

    private UUID id;
    private UUID placeId;
    private String placeName;

    // Reviewer (anonymised to first name + last initial)
    private String reviewerName;
    private String reviewerAvatarUrl;

    // Core review content
    private Integer rating;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate visitDate;

    private String reviewText;
    private String accessibilitySummary;

    // Structured accessibility flags
    private Boolean hadAccessibleEntrance;
    private Boolean hadAccessibleRestroom;
    private Boolean hadAccessibleParking;
    private Boolean hadElevator;
    private Boolean hadStepFreePath;
    private Boolean hadStaffAssistance;

    // Moderation
    private ReviewStatus status;
    private String rejectionReason;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime createdAt;
}

