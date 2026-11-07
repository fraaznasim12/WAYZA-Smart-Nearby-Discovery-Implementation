package com.accessmap.controller;

import com.accessmap.dto.AdminAuditLogDto;
import com.accessmap.dto.ApiResponse;
import com.accessmap.service.AdminAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

    private final AdminAuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminAuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String action,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminAuditLogDto> page = auditLogService.getAuditLogs(resourceType, action, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }
}

