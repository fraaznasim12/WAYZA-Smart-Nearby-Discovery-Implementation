package com.accessmap.common;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Health check status response payload.
 */
public record HealthResponse(
    String status,
    String service,
    String version,
    OffsetDateTime timestamp,
    Map<String, Object> details
) {}

