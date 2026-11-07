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
public class DisputePhotoDto {
    private UUID id;
    private String photoUrl;
    private String caption;
    private OffsetDateTime createdAt;
}

