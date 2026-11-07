package com.accessmap.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.time.OffsetDateTime;
import java.util.List;

public record ObservationSubmitRequest(
    @NotEmpty(message = "Observation checklist must contain at least one feature assessment")
    @Valid
    List<ObservationItemSubmitRequest> items,

    String description,

    OffsetDateTime observationDate,

    @Valid
    List<ObservationEvidenceSubmitRequest> evidence
) {}

