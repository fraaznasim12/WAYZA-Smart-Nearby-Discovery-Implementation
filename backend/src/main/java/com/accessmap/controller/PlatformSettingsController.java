package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.PlatformSettingDto;
import com.accessmap.dto.PlatformSettingUpdateRequest;
import com.accessmap.entity.User;
import com.accessmap.service.PlatformSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class PlatformSettingsController {

    private final PlatformSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlatformSettingDto>>> getSettings() {
        List<PlatformSettingDto> list = settingsService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<PlatformSettingDto>> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody PlatformSettingUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        log.info("Admin {} updating platform setting '{}' to '{}'", adminUser.getEmail(), key, request.value());
        PlatformSettingDto updated = settingsService.updateSetting(key, request.value(), adminUser);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}

