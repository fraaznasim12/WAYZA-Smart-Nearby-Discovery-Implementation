package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminAuditLogDto(
    UUID id,
    UUID actorId,
    String actorName,
    String actorEmail,
    String action,
    String resourceType,
    UUID resourceId,
    String outcome,
    String metadata,
    OffsetDateTime createdAt
) {}

