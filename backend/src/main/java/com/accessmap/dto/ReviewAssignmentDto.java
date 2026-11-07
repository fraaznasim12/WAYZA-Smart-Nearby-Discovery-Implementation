package com.accessmap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAssignmentDto {
    private UUID id;
    private String targetType;
    private UUID targetId;
    private UUID assignedToUserId;
    private String assignedToName;
    private String assignedByName;
    private String status;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime completedAt;
}

