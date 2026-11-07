package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.PlaceOwnershipDto;
import com.accessmap.entity.User;
import com.accessmap.service.AdminBusinessClaimService;
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
@RequestMapping("/api/v1/admin/business-claims")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminBusinessClaimController {

    private final AdminBusinessClaimService claimService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PlaceOwnershipDto>>> getClaims(
            @RequestParam(required = false) Boolean isVerified,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<PlaceOwnershipDto> page = claimService.getClaims(isVerified, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<PlaceOwnershipDto>> verifyClaim(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean approved,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} verifying ownership claim {} with result approved={}", adminUser.getEmail(), id, approved);
        PlaceOwnershipDto dto = claimService.verifyClaim(id, approved, reason, adminUser);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}

