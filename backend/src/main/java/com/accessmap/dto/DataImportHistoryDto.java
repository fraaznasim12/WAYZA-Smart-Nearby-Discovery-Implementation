package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DataImportHistoryDto(
    UUID id,
    String providerName,
    String regionName,
    String boundingBox,
    String status,
    int recordsImported,
    int recordsSkipped,
    int recordsFailed,
    String errorMessage,
    String initiatedByEmail,
    OffsetDateTime createdAt
) {}

