package com.accessmap.dto;

import com.accessmap.entity.ReportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Payload submitted by an authenticated user when reporting an accessibility barrier or issue.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreateRequest {

    @NotNull(message = "Place ID is required")
    private UUID placeId;

    private com.accessmap.entity.ReportType reportType;

    private ReportCategory category;

    private String issueType;

    private String observationStatus;

    private String impact;

    private String isPresent;

    private String observationSource;

    private Integer rating;

    private String whatLiked;

    private String whatImproved;

    private String whatToKnow;

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 5000, message = "Description must be between 5 and 5000 characters")
    private String description;

    private OffsetDateTime observationDate;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    private List<PhotoAttachmentDto> photos = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoAttachmentDto {
        private String url;
        private String objectKey;
        private String caption;
    }
}

