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
public class ModerationActionDto {
    private UUID id;
    private String targetType;
    private UUID targetId;
    private String action;
    private String actorName;
    private String notes;
    private OffsetDateTime createdAt;
}

