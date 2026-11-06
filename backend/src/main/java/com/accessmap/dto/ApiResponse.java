package com.accessmap.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

/**
 * Standardized API Response Envelope for all AccessMap REST endpoints.
 *
 * <p>Ensures consistent response formatting across all controllers as specified in
 * ARCHITECTURE.md § 6:
 * <pre>
 * {
 *   "success": true,
 *   "data": { ... },
 *   "timestamp": "2026-11-06T11:20:00Z"
 * }
 * </pre>
 *
 * @param <T> the response payload type
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
    boolean success,
    T data,
    ApiError error,
    OffsetDateTime timestamp
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, OffsetDateTime.now());
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message, null), OffsetDateTime.now());
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return new ApiResponse<>(false, null, new ApiError(code, message, details), OffsetDateTime.now());
    }
}

