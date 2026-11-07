package com.accessmap.dto;

import com.accessmap.entity.ObservationVerificationStatus;
import com.accessmap.entity.SubmissionType;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ObservationSubmissionDto(
    UUID id,
    UUID placeId,
    String placeName,
    UUID submittedById,
    String submittedByName,
    SubmissionType submissionType,
    ObservationVerificationStatus verificationStatus,
    OffsetDateTime observationDate,
    String description,
    UUID reviewedById,
    String reviewedByName,
    OffsetDateTime reviewedAt,
    String reviewNotes,
    OffsetDateTime createdAt,
    List<ObservationItemDto> items,
    List<ObservationEvidenceDto> evidence
) {}

