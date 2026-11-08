package com.accessmap.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request payload for submitting a new community review for a place.
 */
@Data
public class CreatePlaceReviewRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @PastOrPresent(message = "Visit date cannot be in the future")
    private LocalDate visitDate;

    @Size(max = 2000, message = "Review text must not exceed 2000 characters")
    private String reviewText;

    @Size(max = 1000, message = "Accessibility summary must not exceed 1000 characters")
    private String accessibilitySummary;

    // Structured accessibility checkboxes
    private Boolean hadAccessibleEntrance;
    private Boolean hadAccessibleRestroom;
    private Boolean hadAccessibleParking;
    private Boolean hadElevator;
    private Boolean hadStepFreePath;
    private Boolean hadStaffAssistance;
}

