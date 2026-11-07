package com.accessmap.service;

import com.accessmap.dto.NotificationDto;
import com.accessmap.dto.NotificationPreferenceDto;
import com.accessmap.dto.NotificationPreferenceUpdateRequest;
import com.accessmap.dto.UnreadCountDto;
import com.accessmap.entity.*;
import com.accessmap.repository.NotificationPreferenceRepository;
import com.accessmap.repository.NotificationRepository;
import com.accessmap.repository.PlaceOwnershipRepository;
import com.accessmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core notification dispatch and preference management service.
 * Supports asynchronous in-app notifications and resilient email notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final PlaceOwnershipRepository placeOwnershipRepository;
    private final SseNotificationRegistry sseRegistry;
    private final EmailService emailService;

    // --- Core Dispatch Methods ---

    /**
     * Sends an in-app and/or email notification to a specific user according to their delivery preferences.
     * Wrapped in a try-catch to guarantee that notification failures never abort calling transactions.
     */
    @Transactional
    public Notification sendNotification(User recipient, NotificationType type, String title, String message,
                                        String relatedEntityType, UUID relatedEntityId, String metadata) {
        if (recipient == null) {
            log.warn("Attempted to send notification of type {} with null recipient", type);
            return null;
        }

        try {
            // Check user preferences
            Optional<NotificationPreference> prefOpt = preferenceRepository.findByUserIdAndType(recipient.getId(), type);
            boolean inAppEnabled = prefOpt.map(p -> Boolean.TRUE.equals(p.getInAppEnabled())).orElse(true);
            boolean emailEnabled = prefOpt.map(p -> Boolean.TRUE.equals(p.getEmailEnabled())).orElse(false);

            String finalTitle = (title != null && !title.isBlank()) ? title : type.getDefaultTitle();
            Notification saved = null;

            if (inAppEnabled) {
                Notification notif = Notification.builder()
                        .recipient(recipient)
                        .type(type)
                        .title(finalTitle)
                        .message(message)
                        .relatedEntityType(relatedEntityType)
                        .relatedEntityId(relatedEntityId)
                        .metadata(metadata)
                        .isRead(false)
                        .build();

                saved = notificationRepository.save(notif);

                // Dispatch to active real-time SSE stream
                try {
                    sseRegistry.sendToUser(recipient.getId(), NotificationDto.fromEntity(saved));
                } catch (Exception sseEx) {
                    log.warn("SSE stream dispatch failed for user {}: {}", recipient.getId(), sseEx.getMessage());
                }
            }

            if (emailEnabled && recipient.getEmail() != null && !recipient.getEmail().isBlank()) {
                emailService.sendEmail(recipient.getEmail(), finalTitle, message);
            }

            return saved;
        } catch (Exception ex) {
            log.error("Failed to send notification [{}] to user {}: {}", type, recipient.getId(), ex.getMessage(), ex);
            return null;
        }
    }

    /**
     * Broadcasts an administrative alert to all platform administrators.
     */
    @Transactional
    public void notifyAdmins(NotificationType type, String title, String message,
                             String relatedEntityType, UUID relatedEntityId, String metadata) {
        try {
            List<User> admins = userRepository.findAllByRole(UserRole.ROLE_ADMIN);
            for (User admin : admins) {
                sendNotification(admin, type, title, message, relatedEntityType, relatedEntityId, metadata);
            }
        } catch (Exception ex) {
            log.error("Failed to broadcast admin notifications [{}]: {}", type, ex.getMessage(), ex);
        }
    }

    // --- Domain Event Helpers ---

    public void notifyReportSubmitted(AccessibilityReport report) {
        if (report == null || report.getReportingUser() == null) return;
        String placeName = report.getPlace() != null ? report.getPlace().getName() : "Unknown venue";

        // 1. Notify reporter
        sendNotification(
                report.getReportingUser(),
                NotificationType.REPORT_SUBMITTED,
                "Report Submitted: " + placeName,
                "Your accessibility report '" + report.getTitle() + "' for " + placeName + " has been submitted and is queued for verification.",
                "REPORT",
                report.getId(),
                null
        );

        // 2. Alert platform admins
        notifyAdmins(
                NotificationType.NEW_ACCESSIBILITY_REPORT,
                "New Accessibility Report",
                "User " + report.getReportingUser().getFullName() + " lodged report '" + report.getTitle() + "' for " + placeName + ".",
                "REPORT",
                report.getId(),
                null
        );
    }

    public void notifyStatusChanged(AccessibilityReport report, ReportStatus oldStatus, ReportStatus newStatus, User moderator) {
        if (report == null || report.getReportingUser() == null) return;
        String placeName = report.getPlace() != null ? report.getPlace().getName() : "Unknown venue";

        switch (newStatus) {
            case APPROVED -> {
                sendNotification(
                        report.getReportingUser(),
                        NotificationType.REPORT_APPROVED,
                        "Report Approved: " + placeName,
                        "Your accessibility observation for " + placeName + " has been approved and published to the venue profile.",
                        "REPORT",
                        report.getId(),
                        null
                );

                // Notify verified venue owners if any
                if (report.getPlace() != null) {
                    List<PlaceOwnership> owners = placeOwnershipRepository.findAllByPlaceIdAndIsVerifiedTrue(report.getPlace().getId());
                    for (PlaceOwnership owner : owners) {
                        sendNotification(
                                owner.getUser(),
                                NotificationType.NEW_LOCATION_REPORT,
                                "New Accessibility Observation for Your Venue",
                                "A verified report ('" + report.getTitle() + "') was approved for " + placeName + ".",
                                "REPORT",
                                report.getId(),
                                null
                        );
                    }
                }
            }
            case REJECTED -> {
                String reason = report.getRejectionReason() != null ? report.getRejectionReason() : "Did not meet verification criteria";
                sendNotification(
                        report.getReportingUser(),
                        NotificationType.REPORT_REJECTED,
                        "Report Rejected: " + placeName,
                        "Your report for " + placeName + " could not be approved. Reason: " + reason,
                        "REPORT",
                        report.getId(),
                        null
                );
            }
            case NEEDS_MORE_INFORMATION -> {
                String notes = report.getAdminNotes() != null ? report.getAdminNotes() : "Please provide more details or clearer photo evidence.";
                sendNotification(
                        report.getReportingUser(),
                        NotificationType.ADDITIONAL_INFORMATION_REQUESTED,
                        "Action Needed: " + placeName,
                        "A reviewer requested additional information regarding your report for " + placeName + ": " + notes,
                        "REPORT",
                        report.getId(),
                        null
                );
            }
            default -> log.debug("Status transition {} -> {} does not require dedicated notification", oldStatus, newStatus);
        }
    }

    public void notifyInformationRequested(AccessibilityReport report, String requestNotes) {
        if (report == null || report.getReportingUser() == null) return;
        String placeName = report.getPlace() != null ? report.getPlace().getName() : "venue";
        sendNotification(
                report.getReportingUser(),
                NotificationType.ADDITIONAL_INFORMATION_REQUESTED,
                "Information Requested: " + placeName,
                requestNotes != null ? requestNotes : "Additional details requested for your accessibility report.",
                "REPORT",
                report.getId(),
                null
        );
    }

    public void notifyDisputeCreated(Dispute dispute) {
        if (dispute == null || dispute.getSubmittingUser() == null) return;
        String placeName = dispute.getPlace() != null ? dispute.getPlace().getName() : "venue";
        String feature = dispute.getFeatureCode() != null ? dispute.getFeatureCode() : "accessibility feature";

        sendNotification(
                dispute.getSubmittingUser(),
                NotificationType.DISPUTE_UPDATED,
                "Dispute Lodged: " + placeName,
                "Your dispute regarding '" + feature + "' at " + placeName + " was received and is under review.",
                "DISPUTE",
                dispute.getId(),
                null
        );

        notifyAdmins(
                NotificationType.NEW_DISPUTE,
                "New Dispute Lodged",
                "A dispute was submitted for " + placeName + " (" + feature + ") by " + dispute.getSubmittingUser().getFullName() + ".",
                "DISPUTE",
                dispute.getId(),
                null
        );
    }

    public void notifyDisputeResolved(Dispute dispute) {
        if (dispute == null || dispute.getSubmittingUser() == null) return;
        String placeName = dispute.getPlace() != null ? dispute.getPlace().getName() : "venue";
        String feature = dispute.getFeatureCode() != null ? dispute.getFeatureCode() : "accessibility feature";

        sendNotification(
                dispute.getSubmittingUser(),
                NotificationType.DISPUTE_RESOLVED,
                "Dispute Resolved: " + placeName,
                "Your dispute for " + placeName + " (" + feature + ") was resolved with status " + dispute.getStatus() +
                        (dispute.getResolutionNotes() != null ? ". Notes: " + dispute.getResolutionNotes() : "."),
                "DISPUTE",
                dispute.getId(),
                null
        );
    }

    public void notifyClaimSubmitted(PlaceOwnership claim) {
        if (claim == null || claim.getUser() == null) return;
        String placeName = claim.getPlace() != null ? claim.getPlace().getName() : "venue";

        sendNotification(
                claim.getUser(),
                NotificationType.BUSINESS_OWNERSHIP_UPDATED,
                "Ownership Claim Submitted",
                "Your business ownership claim for " + placeName + " has been submitted for administrative verification.",
                "CLAIM",
                claim.getId(),
                null
        );

        notifyAdmins(
                NotificationType.NEW_BUSINESS_CLAIM,
                "New Business Claim Pending",
                claim.getUser().getFullName() + " submitted a business ownership claim for " + placeName + ".",
                "CLAIM",
                claim.getId(),
                null
        );
    }

    public void notifyClaimReviewed(PlaceOwnership claim, boolean approved, String notes) {
        if (claim == null || claim.getUser() == null) return;
        String placeName = claim.getPlace() != null ? claim.getPlace().getName() : "venue";

        NotificationType type = approved ? NotificationType.BUSINESS_CLAIM_APPROVED : NotificationType.BUSINESS_CLAIM_REJECTED;
        String title = approved ? "Claim Approved: " + placeName : "Claim Decision: " + placeName;
        String message = approved
                ? "Congratulations! Your ownership claim for " + placeName + " has been verified. You can now manage accessibility profiles for this venue."
                : "Your ownership claim for " + placeName + " could not be approved" + (notes != null ? ": " + notes : ".");

        sendNotification(
                claim.getUser(),
                type,
                title,
                message,
                "CLAIM",
                claim.getId(),
                notes
        );
    }

    public void notifyProfileUpdated(Place place, String featureName) {
        if (place == null) return;
        List<PlaceOwnership> owners = placeOwnershipRepository.findAllByPlaceIdAndIsVerifiedTrue(place.getId());
        for (PlaceOwnership owner : owners) {
            sendNotification(
                    owner.getUser(),
                    NotificationType.ACCESSIBILITY_PROFILE_UPDATED,
                    "Venue Profile Updated: " + place.getName(),
                    "The accessibility record for '" + featureName + "' at your venue " + place.getName() + " was updated.",
                    "PLACE",
                    place.getId(),
                    null
            );
        }
    }

    // --- Query and User Management Methods ---

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(User user, Boolean isRead, Pageable pageable) {
        if (isRead == null) {
            return notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                    .map(NotificationDto::fromEntity);
        }
        return notificationRepository.findAllByRecipientIdAndIsReadOrderByCreatedAtDesc(user.getId(), isRead, pageable)
                .map(NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public UnreadCountDto getUnreadCount(User user) {
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return new UnreadCountDto(count);
    }

    @Transactional
    public NotificationDto markAsRead(UUID notificationId, User user) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + notificationId));

        if (!notif.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to view or modify this notification.");
        }

        if (!Boolean.TRUE.equals(notif.getIsRead())) {
            notif.setIsRead(true);
            notif.setReadAt(OffsetDateTime.now());
            notif = notificationRepository.save(notif);
        }

        return NotificationDto.fromEntity(notif);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsRead(user.getId(), OffsetDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<NotificationPreferenceDto> getPreferences(User user) {
        List<NotificationPreference> userPrefs = preferenceRepository.findAllByUserId(user.getId());
        Map<NotificationType, NotificationPreference> map = userPrefs.stream()
                .collect(Collectors.toMap(NotificationPreference::getType, p -> p, (a, b) -> a));

        List<NotificationPreferenceDto> result = new ArrayList<>();
        for (NotificationType type : NotificationType.values()) {
            NotificationPreference pref = map.get(type);
            if (pref != null) {
                result.add(NotificationPreferenceDto.fromEntity(pref));
            } else {
                result.add(NotificationPreferenceDto.defaultForType(type));
            }
        }
        return result;
    }

    @Transactional
    public List<NotificationPreferenceDto> updatePreferences(User user, List<NotificationPreferenceUpdateRequest> updates) {
        if (updates == null || updates.isEmpty()) {
            return getPreferences(user);
        }

        for (NotificationPreferenceUpdateRequest req : updates) {
            if (req.type() == null) continue;
            NotificationPreference pref = preferenceRepository.findByUserIdAndType(user.getId(), req.type())
                    .orElseGet(() -> NotificationPreference.builder()
                            .user(user)
                            .type(req.type())
                            .build());

            pref.setInAppEnabled(req.inAppEnabled());
            pref.setEmailEnabled(req.emailEnabled());
            preferenceRepository.save(pref);
        }

        return getPreferences(user);
    }

    @Transactional
    public int cleanupOldNotifications(int retentionDays) {
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(retentionDays);
        return notificationRepository.deleteOlderThan(cutoff);
    }
}
