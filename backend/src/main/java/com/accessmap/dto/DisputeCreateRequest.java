package com.accessmap.dto;

import com.accessmap.entity.DisputeCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Payload submitted by an authenticated user when challenging or disputing
 * accessibility records or report moderation decisions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeCreateRequest {

    @NotNull(message = "Place ID is required")
    private UUID placeId;

    private UUID reportId;

    private UUID observationId;

    private String featureCode;

    @NotNull(message = "Dispute category is required")
    private DisputeCategory category;

    @NotBlank(message = "Explanation is required")
    @Size(min = 10, max = 5000, message = "Explanation must be between 10 and 5000 characters")
    private String explanation;

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

