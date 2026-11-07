package com.accessmap.controller;

import com.accessmap.dto.AdminOverviewStatsDto;
import com.accessmap.dto.ApiResponse;
import com.accessmap.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping({"/overview", "/dashboard/stats"})
    public ResponseEntity<ApiResponse<AdminOverviewStatsDto>> getOverviewStats() {
        AdminOverviewStatsDto stats = dashboardService.getOverviewStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}

