package com.accessmap.common;

import com.accessmap.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * REST Controller providing application health status and environment telemetry.
 */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Value("${spring.application.name:accessmap-backend}")
    private String applicationName;

    /**
     * GET /api/v1/health
     * Returns a structured JSON response confirming backend operational status.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<HealthResponse>> checkHealth() {
        HealthResponse response = new HealthResponse(
                "UP",
                applicationName,
                "0.1.0-SNAPSHOT",
                OffsetDateTime.now(),
                Map.of(
                        "database", "PostgreSQL 16 + PostGIS 3.4 (configured)",
                        "fourStateModel", "ENABLED",
                        "stalenessSLA", "180 days"
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}

