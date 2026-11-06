package com.accessmap.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standard error structure embedded inside {@link ApiResponse} on failure.
 *
 * @param code    error code identifier (e.g. "RESOURCE_NOT_FOUND", "VALIDATION_ERROR")
 * @param message human-readable summary
 * @param details additional context (field validation errors, etc.)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    String code,
    String message,
    Object details
) {}

