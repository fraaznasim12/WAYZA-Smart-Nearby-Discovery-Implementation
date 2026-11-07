package com.accessmap.service;

import com.accessmap.dto.*;
import com.accessmap.entity.*;
import com.accessmap.exception.BadRequestException;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessibilityReportService {

    private final AccessibilityReportRepository reportRepository;
    private final ReportPhotoRepository photoRepository;
    private final PlaceRepository placeRepository;
    private final MediaStorageService mediaStorageService;
    private final MediaFileRepository mediaFileRepository;
    private final AccessibilityFeatureRepository accessibilityFeatureRepository;
    private final AccessibilityAuditLogRepository accessibilityAuditLogRepository;
    private final NotificationService notificationService;
    private final ReviewAssignmentRepository reviewAssignmentRepository;
    private final ModerationActionRepository moderationActionRepository;
    private final UserRepository userRepository;
    private final FeatureDefinitionRepository featureDefinitionRepository;

    private static final int MAX_PHOTOS_PER_REPORT = 5;
    private static final long MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    /**
     * Submits a community accessibility report with optional attached photos.
     */
    @Transactional
    public ReportResponseDto createReport(ReportCreateRequest request, User user, List<MultipartFile> files) {
        if (user == null) {
            throw new BadRequestException("Authenticated user is required to submit a report.");
        }

        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + request.getPlaceId()));

        int incomingFilesCount = files != null ? files.size() : 0;
        int incomingUrlsCount = request.getPhotos() != null ? request.getPhotos().size() : 0;
        if (incomingFilesCount + incomingUrlsCount > MAX_PHOTOS_PER_REPORT) {
            throw new BadRequestException(String.format("Exceeded maximum of %d photographs per report.", MAX_PHOTOS_PER_REPORT));
        }

        AccessibilityReport report = AccessibilityReport.builder()
                .place(place)
                .reportingUser(user)
                .category(request.getCategory())
                .issueType(request.getIssueType())
                .title(request.getTitle())
                .description(request.getDescription())
                .observationDate(request.getObservationDate() != null ? request.getObservationDate() : OffsetDateTime.now())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(ReportStatus.PENDING)
                .build();

        report = reportRepository.save(report);

        // Process multipart file uploads if provided
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
                    throw new BadRequestException(String.format("File '%s' exceeds the 10MB size limit.", file.getOriginalFilename()));
                }

                MediaStorageService.UploadResult upload = mediaStorageService.uploadReportEvidence(file);

                MediaFile mediaFile = MediaFile.builder()
                        .owner(user)
                        .purpose("REPORT_EVIDENCE")
                        .objectKey(upload.objectKey())
                        .bucketName(upload.bucketName())
                        .mimeType(upload.mimeType())
                        .fileSizeBytes(upload.fileSizeBytes())
                        .checksumSha256(upload.checksumSha256())
                        .visibility("PENDING_REVIEW")
                        .accessibilityReport(report)
                        .build();
                mediaFile = mediaFileRepository.save(mediaFile);

                String photoUrl = mediaStorageService.generatePresignedGetUrl(upload.objectKey());
                ReportPhoto photo = ReportPhoto.builder()
                        .report(report)
                        .mediaFile(mediaFile)
                        .objectKey(upload.objectKey())
                        .photoUrl(photoUrl)
                        .caption(file.getOriginalFilename())
                        .build();
                photoRepository.save(photo);
                report.addPhoto(photo);
            }
        }

        // Process any pre-uploaded or link-based photos
        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            for (ReportCreateRequest.PhotoAttachmentDto att : request.getPhotos()) {
                if (att == null || att.getUrl() == null || att.getUrl().isBlank()) continue;
                ReportPhoto photo = ReportPhoto.builder()
                        .report(report)
                        .photoUrl(att.getUrl())
                        .objectKey(att.getObjectKey())
                        .caption(att.getCaption())
                        .build();
                photoRepository.save(photo);
                report.addPhoto(photo);
            }
        }

        notificationService.notifyReportSubmitted(report);
        return mapToDto(report, true);
    }

    /**
     * Attaches an individual photograph to an existing report.
     */
    @Transactional
    public ReportPhotoDto uploadPhotoToReport(UUID reportId, User user, MultipartFile file, String caption) {
        AccessibilityReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        if (!report.getReportingUser().getId().equals(user.getId()) && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to attach photos to this report.");
        }

        long currentCount = photoRepository.findAllByReportIdOrderByCreatedAtAsc(reportId).size();
        if (currentCount >= MAX_PHOTOS_PER_REPORT) {
            throw new BadRequestException("Report already contains maximum allowed photos (" + MAX_PHOTOS_PER_REPORT + ").");
        }

        MediaStorageService.UploadResult upload = mediaStorageService.uploadReportEvidence(file);

        MediaFile mediaFile = MediaFile.builder()
                .owner(user)
                .purpose("REPORT_EVIDENCE")
                .objectKey(upload.objectKey())
                .bucketName(upload.bucketName())
                .mimeType(upload.mimeType())
                .fileSizeBytes(upload.fileSizeBytes())
                .checksumSha256(upload.checksumSha256())
                .visibility("PENDING_REVIEW")
                .accessibilityReport(report)
                .build();
        mediaFile = mediaFileRepository.save(mediaFile);

        String photoUrl = mediaStorageService.generatePresignedGetUrl(upload.objectKey());
        ReportPhoto photo = ReportPhoto.builder()
                .report(report)
                .mediaFile(mediaFile)
                .objectKey(upload.objectKey())
                .photoUrl(photoUrl)
                .caption(caption != null ? caption : file.getOriginalFilename())
                .build();
        photo = photoRepository.save(photo);
        report.addPhoto(photo);

        return new ReportPhotoDto(photo.getId(), photo.getPhotoUrl(), photo.getCaption(), photo.getCreatedAt());
    }

    /**
     * Retrieves all reports submitted by the current user.
     */
    @Transactional(readOnly = true)
    public List<ReportResponseDto> getMyReports(User user) {
        List<AccessibilityReport> reports = reportRepository.findAllByReportingUserIdWithDetails(user.getId());
        return reports.stream().map(r -> mapToDto(r, true)).toList();
    }

    /**
     * Retrieves a report by ID with ownership verification.
     */
    @Transactional(readOnly = true)
    public ReportResponseDto getReportById(UUID reportId, User user) {
        AccessibilityReport report = reportRepository.findByIdWithDetails(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = report.getReportingUser().getId().equals(user.getId());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to view this report.");
        }

        return mapToDto(report, isAdmin);
    }

    /**
     * Admin: Retrieves reports with optional status filter and pagination.
     */
    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getAdminReports(ReportStatus status, Pageable pageable) {
        Page<AccessibilityReport> page;
        if (status != null) {
            page = reportRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(r -> mapToDto(r, true));
    }

    /**
     * Admin: Updates report status with moderation notes and optional profile integration.
     */
    @Transactional
    public ReportResponseDto updateReportStatus(UUID reportId, ReportStatusUpdateRequest request, User admin) {
        AccessibilityReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        ReportStatus oldStatus = report.getStatus();
        ReportStatus newStatus = request.getStatus();

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new BadRequestException(String.format("Invalid report status transition from %s to %s.", oldStatus, newStatus));
        }

        if (newStatus == ReportStatus.REJECTED) {
            String reason = request.getRejectionReason();
            if (reason == null || reason.trim().isEmpty()) {
                if (request.getAdminNotes() != null && !request.getAdminNotes().trim().isEmpty()) {
                    reason = request.getAdminNotes().trim();
                } else {
                    throw new BadRequestException("Rejection reason is required when rejecting a report.");
                }
            }
            report.setRejectionReason(reason);
        }

        report.setStatus(newStatus);
        report.setAdminNotes(request.getAdminNotes());
        report.setReviewedByUser(admin);
        report.setReviewedAt(OffsetDateTime.now());

        if (newStatus == ReportStatus.RESOLVED) {
            report.setResolvedAt(OffsetDateTime.now());
        }

        // Handle evidence photo visibility update
        String mediaVisibility = switch (newStatus) {
            case APPROVED, RESOLVED -> "APPROVED";
            case REJECTED -> "REJECTED";
            default -> "PENDING_REVIEW";
        };
        for (ReportPhoto photo : report.getPhotos()) {
            if (photo.getMediaFile() != null) {
                photo.getMediaFile().setVisibility(mediaVisibility);
                mediaFileRepository.save(photo.getMediaFile());
            }
        }

        // Accessibility Profile Integration on APPROVAL
        if (newStatus == ReportStatus.APPROVED && Boolean.TRUE.equals(request.getUpdateAccessibilityFeature())) {
            String featureCode = request.getFeatureCode();
            FeatureStatus targetFeatureStatus = request.getFeatureStatus();

            if (featureCode != null && targetFeatureStatus != null) {
                FeatureType featureType = FeatureType.fromCode(featureCode);
                if (featureType != null) {
                    Place place = report.getPlace();
                    AccessibilityFeature feature = accessibilityFeatureRepository
                            .findByPlaceIdAndFeatureType(place.getId(), featureType)
                            .orElseGet(() -> AccessibilityFeature.builder()
                                    .place(place)
                                    .featureType(featureType)
                                    .build());

                    FeatureStatus oldFeatureStatus = feature.getStatus();
                    feature.setStatus(targetFeatureStatus);
                    feature.setLastVerifiedAt(OffsetDateTime.now());
                    feature.setNotes("Updated via Community Report: " + report.getTitle());
                    accessibilityFeatureRepository.save(feature);

                    accessibilityAuditLogRepository.save(AccessibilityAuditLog.builder()
                            .place(place)
                            .featureCode(featureCode)
                            .oldStatus(oldFeatureStatus)
                            .newStatus(targetFeatureStatus)
                            .changedBy(admin)
                            .action("COMMUNITY_REPORT_APPROVED")
                            .notes(String.format("Report ID: %s (%s). %s",
                                    report.getId(),
                                    report.getTitle(),
                                    request.getAdminNotes() != null ? request.getAdminNotes() : ""))
                            .build());

                    report.setProfileUpdated(true);
                    log.info("Place {} feature {} updated to {} via Report {}",
                            place.getId(), featureCode, targetFeatureStatus, report.getId());
                }
            }
        }

        report = reportRepository.save(report);

        // Record moderation audit trail
        ModerationAction action = ModerationAction.builder()
                .actor(admin)
                .targetType("REPORT")
                .targetId(report.getId())
                .action("STATUS_UPDATE_" + newStatus.name())
                .notes((report.getRejectionReason() != null ? "Reason: " + report.getRejectionReason() + ". " : "") +
                       (request.getAdminNotes() != null ? request.getAdminNotes() : ""))
                .build();
        moderationActionRepository.save(action);

        notificationService.notifyStatusChanged(report, oldStatus, newStatus, admin);
        return mapToDto(report, true);
    }

    /**
     * Admin: Assigns a report to a designated reviewer with reviewer separation check.
     */
    @Transactional
    public ReportResponseDto assignReportReviewer(UUID reportId, UUID reviewerId, User admin, String notes) {
        AccessibilityReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        if (report.getReportingUser().getId().equals(reviewerId)) {
            throw new BadRequestException("Reviewer separation violation: A contributor cannot be assigned to review their own report.");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer user not found with id: " + reviewerId));

        report.setAssignedReviewer(reviewer);
        if (report.getStatus() == ReportStatus.PENDING) {
            report.setStatus(ReportStatus.IN_REVIEW);
        }

        ReviewAssignment assignment = ReviewAssignment.builder()
                .targetType("REPORT")
                .targetId(report.getId())
                .assignedTo(reviewer)
                .assignedBy(admin)
                .status("ASSIGNED")
                .notes(notes)
                .build();
        reviewAssignmentRepository.save(assignment);

        ModerationAction action = ModerationAction.builder()
                .actor(admin)
                .targetType("REPORT")
                .targetId(report.getId())
                .action("ASSIGN_REVIEWER")
                .notes("Assigned to reviewer: " + reviewer.getFullName() + (notes != null ? ". " + notes : ""))
                .build();
        moderationActionRepository.save(action);

        report = reportRepository.save(report);
        return mapToDto(report, true);
    }

    /**
     * Admin: Requests additional information from the report submitter.
     */
    @Transactional
    public ReportResponseDto requestMoreInformation(UUID reportId, String requestNotes, User admin) {
        if (requestNotes == null || requestNotes.trim().isEmpty()) {
            throw new BadRequestException("Notes explaining the requested information are required.");
        }

        AccessibilityReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        ReportStatus oldStatus = report.getStatus();
        if (!oldStatus.canTransitionTo(ReportStatus.NEEDS_MORE_INFORMATION)) {
            throw new BadRequestException(String.format("Cannot transition report from %s to NEEDS_MORE_INFORMATION.", oldStatus));
        }

        report.setStatus(ReportStatus.NEEDS_MORE_INFORMATION);
        report.setInfoRequestedAt(OffsetDateTime.now());
        report.setAdminNotes(requestNotes.trim());
        report.setReviewedByUser(admin);
        report.setReviewedAt(OffsetDateTime.now());

        ModerationAction action = ModerationAction.builder()
                .actor(admin)
                .targetType("REPORT")
                .targetId(report.getId())
                .action("REQUEST_INFO")
                .notes(requestNotes)
                .build();
        moderationActionRepository.save(action);

        report = reportRepository.save(report);
        return mapToDto(report, true);
    }

    /**
     * Moderator Evidence Review: Detects duplicates and conflicts for a report.
     */
    @Transactional(readOnly = true)
    public ConflictDetectionDto detectConflicts(UUID reportId) {
        AccessibilityReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        Place place = report.getPlace();
        FeatureType candidateType = mapCategoryToFeatureType(report.getCategory());
        String featureCode = candidateType != null ? candidateType.name() : report.getCategory().name();

        FeatureStatus currentStatus = null;
        OffsetDateTime lastVerified = null;

        if (candidateType != null) {
            var featureOpt = accessibilityFeatureRepository.findByPlaceIdAndFeatureType(place.getId(), candidateType);
            if (featureOpt.isPresent()) {
                currentStatus = featureOpt.get().getStatus();
                lastVerified = featureOpt.get().getLastVerifiedAt();
            }
        }

        List<AccessibilityReport> otherReports = reportRepository.findAllByPlaceIdAndIdNotOrderByCreatedAtDesc(place.getId(), reportId);
        List<ConflictDetectionDto.SimilarReportSummary> similarList = new ArrayList<>();
        for (AccessibilityReport r : otherReports) {
            similarList.add(ConflictDetectionDto.SimilarReportSummary.builder()
                    .id(r.getId())
                    .title(r.getTitle())
                    .status(r.getStatus().name())
                    .submitterName(r.getReportingUser() != null ? r.getReportingUser().getFullName() : "Anonymous")
                    .createdAt(r.getCreatedAt())
                    .photosCount(r.getPhotos() != null ? r.getPhotos().size() : 0)
                    .build());
        }

        boolean hasConflict = false;
        String conflictDescription = "No conflicts detected. Verified baseline and community observations align.";

        if (currentStatus == FeatureStatus.AVAILABLE) {
            hasConflict = true;
            conflictDescription = String.format("Conflict detected: Report flags '%s' as inaccessible or defective, but place currently has status AVAILABLE verified on %s.",
                    report.getCategory().getDisplayName(),
                    lastVerified != null ? lastVerified.toLocalDate().toString() : "an unknown date");
        } else if (!similarList.isEmpty()) {
            conflictDescription = String.format("Found %d other community report(s) on this venue. Review them to prevent duplicate effort.", similarList.size());
        }

        return ConflictDetectionDto.builder()
                .reportId(report.getId())
                .placeId(place.getId())
                .placeName(place.getName())
                .featureCode(featureCode)
                .currentFeatureStatus(currentStatus)
                .currentLastVerifiedAt(lastVerified)
                .similarReports(similarList)
                .hasConflict(hasConflict)
                .conflictDescription(conflictDescription)
                .build();
    }

    /**
     * Information Freshness Audit: Assesses verification freshness without altering statuses.
     */
    @Transactional(readOnly = true)
    public PlaceFreshnessDto getPlaceFreshness(UUID placeId, Integer thresholdDays) {
        int threshold = (thresholdDays != null && thresholdDays > 0) ? thresholdDays : 90;

        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        List<FeatureDefinition> definitions = featureDefinitionRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc();
        List<AccessibilityFeature> features = accessibilityFeatureRepository.findAllByPlaceId(placeId);
        Map<FeatureType, AccessibilityFeature> featureMap = features.stream()
                .collect(Collectors.toMap(AccessibilityFeature::getFeatureType, f -> f, (a, b) -> a));

        List<PlaceFreshnessDto.FeatureFreshnessItem> items = new ArrayList<>();
        int freshCount = 0;
        int staleCount = 0;
        int unverifiedCount = 0;

        OffsetDateTime now = OffsetDateTime.now();

        for (FeatureDefinition def : definitions) {
            FeatureType type = FeatureType.fromCode(def.getCode());
            AccessibilityFeature feature = type != null ? featureMap.get(type) : null;

            FeatureStatus status = feature != null ? feature.getStatus() : FeatureStatus.UNKNOWN;
            OffsetDateTime lastVerified = feature != null ? feature.getLastVerifiedAt() : null;

            Long daysSinceVerification = null;
            boolean isStale = false;
            String rating;

            if (lastVerified != null) {
                daysSinceVerification = Duration.between(lastVerified, now).toDays();
                if (daysSinceVerification < 0) daysSinceVerification = 0L;

                if (daysSinceVerification <= 30) {
                    rating = "FRESH";
                    freshCount++;
                } else if (daysSinceVerification <= threshold) {
                    rating = "AGING";
                    freshCount++;
                } else {
                    rating = "STALE";
                    staleCount++;
                    isStale = true;
                }
            } else {
                rating = "NEVER_VERIFIED";
                unverifiedCount++;
                isStale = true;
            }

            items.add(PlaceFreshnessDto.FeatureFreshnessItem.builder()
                    .featureCode(def.getCode())
                    .featureName(def.getName())
                    .status(status)
                    .lastVerifiedAt(lastVerified)
                    .daysSinceVerification(daysSinceVerification)
                    .isStale(isStale)
                    .freshnessRating(rating)
                    .build());
        }

        return PlaceFreshnessDto.builder()
                .placeId(place.getId())
                .placeName(place.getName())
                .freshnessThresholdDays(threshold)
                .totalFeatures(definitions.size())
                .freshCount(freshCount)
                .staleCount(staleCount)
                .unverifiedCount(unverifiedCount)
                .features(items)
                .build();
    }

    private FeatureType mapCategoryToFeatureType(ReportCategory category) {
        if (category == null) return null;
        return switch (category) {
            case INACCESSIBLE_ENTRANCE -> FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE;
            case DAMAGED_OR_MISSING_RAMP -> FeatureType.ENTRANCE_RAMP;
            case ELEVATOR_UNAVAILABLE -> FeatureType.ELEVATOR_AVAILABILITY;
            case INACCESSIBLE_WASHROOM -> FeatureType.ACCESSIBLE_WASHROOM;
            case BLOCKED_PATHWAY -> FeatureType.WHEELCHAIR_ACCESSIBLE_PATHWAYS;
            case INACCESSIBLE_PARKING -> FeatureType.ACCESSIBLE_PARKING;
            case MISSING_SIGNAGE -> FeatureType.BRAILLE_SIGNAGE;
            case OTHER -> null;
        };
    }

    private ReportResponseDto mapToDto(AccessibilityReport report, boolean includeFullUser) {
        List<ReportPhotoDto> photoDtos = new ArrayList<>();
        if (report.getPhotos() != null) {
            for (ReportPhoto photo : report.getPhotos()) {
                String url = photo.getPhotoUrl();
                // Regenerate pre-signed URL if object key is present to guarantee fresh access
                if (photo.getObjectKey() != null) {
                    try {
                        url = mediaStorageService.generatePresignedGetUrl(photo.getObjectKey());
                    } catch (Exception ignored) {}
                }
                photoDtos.add(new ReportPhotoDto(photo.getId(), url, photo.getCaption(), photo.getCreatedAt()));
            }
        }

        String userEmail = null;
        String userName = "Community Contributor";
        if (report.getReportingUser() != null) {
            userName = report.getReportingUser().getFullName();
            if (includeFullUser) {
                userEmail = report.getReportingUser().getEmail();
            } else {
                // Mask email for public/privacy
                String raw = report.getReportingUser().getEmail();
                int atIdx = raw.indexOf('@');
                if (atIdx > 2) {
                    userEmail = raw.charAt(0) + "***" + raw.substring(atIdx);
                } else {
                    userEmail = "***@***";
                }
            }
        }

        return ReportResponseDto.builder()
                .id(report.getId())
                .placeId(report.getPlace() != null ? report.getPlace().getId() : null)
                .placeName(report.getPlace() != null ? report.getPlace().getName() : null)
                .placeAddress(report.getPlace() != null ? report.getPlace().getAddress() : null)
                .reportingUserId(report.getReportingUser() != null ? report.getReportingUser().getId() : null)
                .reportingUserName(userName)
                .reportingUserEmail(userEmail)
                .category(report.getCategory())
                .categoryDisplayName(report.getCategory() != null ? report.getCategory().getDisplayName() : null)
                .issueType(report.getIssueType())
                .title(report.getTitle())
                .description(report.getDescription())
                .observationDate(report.getObservationDate())
                .latitude(report.getLatitude())
                .longitude(report.getLongitude())
                .status(report.getStatus())
                .adminNotes(report.getAdminNotes())
                .rejectionReason(report.getRejectionReason())
                .infoRequestedAt(report.getInfoRequestedAt())
                .assignedReviewerName(report.getAssignedReviewer() != null ? report.getAssignedReviewer().getFullName() : null)
                .reviewedByName(report.getReviewedByUser() != null ? report.getReviewedByUser().getFullName() : null)
                .reviewedAt(report.getReviewedAt())
                .resolvedAt(report.getResolvedAt())
                .profileUpdated(report.isProfileUpdated())
                .photos(photoDtos)
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
