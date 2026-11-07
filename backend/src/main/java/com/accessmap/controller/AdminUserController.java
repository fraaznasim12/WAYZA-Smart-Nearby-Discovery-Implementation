package com.accessmap.controller;

import com.accessmap.dto.AdminUserRoleUpdateRequest;
import com.accessmap.dto.AdminUserStatusUpdateRequest;
import com.accessmap.dto.AdminUserSummaryDto;
import com.accessmap.dto.ApiResponse;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserSummaryDto>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean isEnabled,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminUserSummaryDto> page = adminUserService.getUsers(search, role, isEnabled, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserSummaryDto>> getUserDetails(@PathVariable UUID id) {
        AdminUserSummaryDto user = adminUserService.getUserDetails(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserSummaryDto>> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUserStatusUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} changing user {} status to isEnabled={}", adminUser.getEmail(), id, request.isEnabled());
        AdminUserSummaryDto updated = adminUserService.updateUserStatus(id, request.isEnabled(), request.reason(), adminUser);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserSummaryDto>> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUserRoleUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} changing user {} role to {}", adminUser.getEmail(), id, request.role());
        AdminUserSummaryDto updated = adminUserService.updateUserRole(id, request.role(), request.reason(), adminUser);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}

