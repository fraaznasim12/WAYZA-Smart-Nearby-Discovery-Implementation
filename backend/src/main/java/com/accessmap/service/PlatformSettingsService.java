package com.accessmap.service;

import com.accessmap.dto.PlatformSettingDto;
import com.accessmap.entity.PlatformSetting;
import com.accessmap.entity.User;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformSettingsService {

    private final PlatformSettingRepository settingRepository;
    private final AdminAuditLogService auditLogService;

    @jakarta.annotation.PostConstruct
    public void initDefaultSettings() {
        if (settingRepository.count() == 0) {
            List<PlatformSetting> defaults = List.of(
                    PlatformSetting.builder().key("upload.max_file_size_mb").value("10").group("STORAGE").description("Maximum allowed file size for image uploads (MB)").build(),
                    PlatformSetting.builder().key("verification.freshness_threshold_days").value("90").group("VERIFICATION").description("Threshold in days before accessibility data is considered stale").build(),
                    PlatformSetting.builder().key("moderation.auto_escalate_disputes_days").value("7").group("MODERATION").description("Number of days before an unresolved dispute is flagged for urgent review").build(),
                    PlatformSetting.builder().key("import.rate_limit_per_minute").value("30").group("IMPORT").description("Maximum permitted Overpass API queries per minute to prevent rate limiting").build(),
                    PlatformSetting.builder().key("notifications.admin_email_alerts").value("true").group("NOTIFICATIONS").description("Send notification alerts to system admins when new reports or disputes are lodged").build()
            );
            settingRepository.saveAll(defaults);
        }
    }

    @Transactional(readOnly = true)
    public List<PlatformSettingDto> getAllSettings() {
        return settingRepository.findAllByOrderByGroupAscKeyAsc().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public String getSetting(String key, String defaultValue) {
        return settingRepository.findByKey(key)
                .map(PlatformSetting::getValue)
                .orElse(defaultValue);
    }

    @Transactional
    public PlatformSettingDto updateSetting(String key, String newValue, User adminUser) {
        PlatformSetting setting = settingRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with key: " + key));

        String oldValue = setting.getValue();
        setting.setValue(newValue);
        setting.setUpdatedBy(adminUser);
        PlatformSetting saved = settingRepository.save(setting);

        auditLogService.log(
                adminUser,
                "UPDATE_SETTING",
                "SETTING",
                saved.getId(),
                "SUCCESS",
                String.format("Updated setting '%s' from '%s' to '%s'", key, oldValue, newValue)
        );

        return mapToDto(saved);
    }

    private PlatformSettingDto mapToDto(PlatformSetting s) {
        return new PlatformSettingDto(
                s.getId(),
                s.getKey(),
                s.getValue(),
                s.getGroup(),
                s.getDescription(),
                s.getUpdatedAt(),
                s.getUpdatedBy() != null ? s.getUpdatedBy().getEmail() : null
        );
    }
}

