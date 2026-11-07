package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.DataImportHistoryDto;
import com.accessmap.dto.DataManagementOverviewDto;
import com.accessmap.dto.OsmImportResult;
import com.accessmap.entity.User;
import com.accessmap.service.AdminDataManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/data-management")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminDataManagementController {

    private final AdminDataManagementService dataManagementService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DataManagementOverviewDto>> getOverview() {
        DataManagementOverviewDto overview = dataManagementService.getOverview();
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<DataImportHistoryDto>>> getImportHistory(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<DataImportHistoryDto> page = dataManagementService.getImportHistory(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<OsmImportResult>> triggerImport(
            @RequestParam String region,
            @RequestParam double south,
            @RequestParam double west,
            @RequestParam double north,
            @RequestParam double east,
            @RequestParam(required = false) List<String> categories,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} triggering regional import for region: {}", adminUser.getEmail(), region);
        OsmImportResult result = dataManagementService.triggerRegionalImport(
                region, south, west, north, east,
                categories != null ? categories : List.of(),
                adminUser
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

