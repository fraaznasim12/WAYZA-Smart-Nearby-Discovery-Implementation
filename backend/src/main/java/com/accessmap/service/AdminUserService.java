package com.accessmap.service;

import com.accessmap.dto.AdminUserSummaryDto;
import com.accessmap.entity.NotificationType;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.exception.BadRequestException;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserRepository userRepository;
    private final AccessibilityReportRepository reportRepository;
    private final DisputeRepository disputeRepository;
    private final ObservationSubmissionRepository observationRepository;
    private final AdminAuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<AdminUserSummaryDto> getUsers(String search, UserRole role, Boolean isEnabled, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<User> users = userRepository.searchUsers(cleanSearch, role, isEnabled, pageable);
        return users.map(this::mapToSummary);
    }

    @Transactional(readOnly = true)
    public AdminUserSummaryDto getUserDetails(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToSummary(user);
    }

    @Transactional
    public AdminUserSummaryDto updateUserStatus(UUID userId, boolean isEnabled, String reason, User adminUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Safeguard: Administrators cannot deactivate their own account
        if (adminUser.getId().equals(userId) && !isEnabled) {
            throw new BadRequestException("Administrators cannot deactivate their own account.");
        }

        boolean previousStatus = Boolean.TRUE.equals(user.getIsEnabled());
        if (previousStatus == isEnabled) {
            return mapToSummary(user);
        }

        user.setIsEnabled(isEnabled);
        User saved = userRepository.save(user);

        String action = isEnabled ? "ACTIVATE_USER" : "DEACTIVATE_USER";
        auditLogService.log(
                adminUser,
                action,
                "USER",
                user.getId(),
                "SUCCESS",
                String.format("User %s (%s) %s by admin %s. Reason: %s",
                        user.getFullName(), user.getEmail(),
                        isEnabled ? "activated" : "deactivated",
                        adminUser.getEmail(),
                        reason != null ? reason : "Administrative moderation")
        );

        try {
            notificationService.sendNotification(
                    saved,
                    NotificationType.ACCOUNT_SECURITY_ALERT,
                    "Account Status Updated",
                    "Your AccessMap account status was updated to " + (isEnabled ? "ACTIVE" : "INACTIVE") +
                            (reason != null ? ". Reason: " + reason : "."),
                    "USER",
                    user.getId(),
                    null
            );
        } catch (Exception ex) {
            log.warn("Failed to dispatch user status notification: {}", ex.getMessage());
        }

        return mapToSummary(saved);
    }

    @Transactional
    public AdminUserSummaryDto updateUserRole(UUID userId, UserRole newRole, String reason, User adminUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Safeguard: Prevent administrator from demoting themselves
        if (adminUser.getId().equals(userId) && user.getRole() == UserRole.ROLE_ADMIN && newRole != UserRole.ROLE_ADMIN) {
            throw new BadRequestException("Administrators cannot revoke their own admin role.");
        }

        UserRole oldRole = user.getRole();
        if (oldRole == newRole) {
            return mapToSummary(user);
        }

        user.setRole(newRole);
        User saved = userRepository.save(user);

        auditLogService.log(
                adminUser,
                "CHANGE_USER_ROLE",
                "USER",
                user.getId(),
                "SUCCESS",
                String.format("Changed role for %s (%s) from %s to %s by %s. Reason: %s",
                        user.getFullName(), user.getEmail(), oldRole, newRole, adminUser.getEmail(),
                        reason != null ? reason : "Administrative role modification")
        );

        try {
            notificationService.sendNotification(
                    saved,
                    NotificationType.ACCOUNT_SECURITY_ALERT,
                    "Account Role Updated",
                    "Your AccessMap platform role has been changed from " + oldRole.name() + " to " + newRole.name() +
                            (reason != null ? ". Reason: " + reason : "."),
                    "USER",
                    user.getId(),
                    null
            );
        } catch (Exception ex) {
            log.warn("Failed to dispatch user role notification: {}", ex.getMessage());
        }

        return mapToSummary(saved);
    }

    private AdminUserSummaryDto mapToSummary(User user) {
        long reportsCount = 0;
        long disputesCount = 0;
        long observationsCount = 0;

        try {
            reportsCount = reportRepository.findAllByReportingUserIdOrderByCreatedAtDesc(user.getId(), Pageable.unpaged()).getTotalElements();
            disputesCount = disputeRepository.findAllBySubmittingUserIdOrderByCreatedAtDesc(user.getId(), Pageable.unpaged()).getTotalElements();
            observationsCount = observationRepository.findAllBySubmittedByIdOrderByCreatedAtDesc(user.getId()).size();
        } catch (Exception e) {
            log.debug("Error computing user counts for {}: {}", user.getId(), e.getMessage());
        }

        return new AdminUserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getIsEnabled(),
                user.getAvatarObjectKey(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                reportsCount,
                disputesCount,
                observationsCount
        );
    }
}
