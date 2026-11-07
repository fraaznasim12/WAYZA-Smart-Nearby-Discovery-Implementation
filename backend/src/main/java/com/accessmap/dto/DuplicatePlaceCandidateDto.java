package com.accessmap.dto;

import java.util.UUID;

public record DuplicatePlaceCandidateDto(
    UUID originalPlaceId,
    String originalPlaceName,
    UUID candidateId,
    String candidateName,
    String candidateAddress,
    String candidateCategory,
    double candidateLatitude,
    double candidateLongitude,
    double distanceMeters,
    String similarityReason
) {}

