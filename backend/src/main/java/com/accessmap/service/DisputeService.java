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

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final DisputePhotoRepository disputePhotoRepository;
    private final PlaceRepository placeRepository;
    private final AccessibilityReportRepository reportRepository;
    private final UserRepository userRepository;
    private final MediaStorageService mediaStorageService;
    private final MediaFileRepository mediaFileRepository;
    private final AccessibilityFeatureRepository accessibilityFeatureRepository;
    private final AccessibilityAuditLogRepository auditLogRepository;
    private final ReviewAssignmentRepository reviewAssignmentRepository;
    private final ModerationActionRepository moderationActionRepository;
    private final NotificationService notificationService;

    private static final int MAX_PHOTOS_PER_DISPUTE = 5;
    private static final long MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    /**
     * Submits a community dispute regarding accessibility records or report decisions.
     */
    @Transactional
    public DisputeResponseDto createDispute(DisputeCreateRequest request, User user, List<MultipartFile> files) {
        if (user == null) {
            throw new BadRequestException("Authenticated user is required to submit a dispute.");
        }

        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + request.getPlaceId()));

        AccessibilityReport report = null;
        if (request.getReportId() != null) {
            report = reportRepository.findById(request.getReportId())
                    .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + request.getReportId()));
        }

        // Prevent duplicate open disputes by same user for same place/feature
        if (request.getFeatureCode() != null) {
            boolean duplicateExists = disputeRepository.existsByPlaceIdAndFeatureCodeAndStatusIn(
                    place.getId(),
                    request.getFeatureCode(),
                    List.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ADDITIONAL_INFORMATION_REQUIRED)
            );
            if (duplicateExists) {
                throw new BadRequestException("An active dispute is already being reviewed for this facility feature.");
            }
        }

        int incomingFiles = files != null ? files.size() : 0;
        int incomingUrls = request.getPhotos() != null ? request.getPhotos().size() : 0;
        if (incomingFiles + incomingUrls > MAX_PHOTOS_PER_DISPUTE) {
            throw new BadRequestException("Maximum 5 photographs allowed per dispute.");
        }

        Dispute dispute = Dispute.builder()
                .place(place)
                .report(report)
                .featureCode(request.getFeatureCode())
                .submittingUser(user)
                .category(request.getCategory())
                .explanation(request.getExplanation())
                .status(DisputeStatus.OPEN)
                .build();

        dispute = disputeRepository.save(dispute);

        // Upload attached photo files
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
                    throw new BadRequestException("File exceeds 10MB limit: " + file.getOriginalFilename());
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
                        .build();
                mediaFile = mediaFileRepository.save(mediaFile);

                String photoUrl = mediaStorageService.generatePresignedGetUrl(upload.objectKey());
                DisputePhoto photo = DisputePhoto.builder()
                        .dispute(dispute)
                        .mediaFile(mediaFile)
                        .objectKey(upload.objectKey())
                        .photoUrl(photoUrl)
                        .caption(file.getOriginalFilename())
                        .build();
                disputePhotoRepository.save(photo);
                dispute.addPhoto(photo);
            }
        }

        // Attach pre-uploaded URLs
        if (request.getPhotos() != null) {
            for (DisputeCreateRequest.PhotoAttachmentDto att : request.getPhotos()) {
                if (att == null || att.getUrl() == null || att.getUrl().isBlank()) continue;
                DisputePhoto photo = DisputePhoto.builder()
                        .dispute(dispute)
                        .photoUrl(att.getUrl())
                        .objectKey(att.getObjectKey())
                        .caption(att.getCaption())
                        .build();
                disputePhotoRepository.save(photo);
                dispute.addPhoto(photo);
            }
        }

        // If disputing an approved report, transition the report status to DISPUTED
        if (report != null && report.getStatus() == ReportStatus.APPROVED) {
            report.setStatus(ReportStatus.DISPUTED);
            reportRepository.save(report);
        }

        moderationActionRepository.save(ModerationAction.builder()
                .targetType("DISPUTE")
                .targetId(dispute.getId())
                .action("DISPUTE_SUBMITTED")
                .actor(user)
                .notes(dispute.getExplanation())
                .build());

        log.info("Dispute {} created by user {} for place {}", dispute.getId(), user.getEmail(), place.getId());
        try {
            notificationService.notifyDisputeCreated(dispute);
        } catch (Exception ex) {
            log.warn("Failed to dispatch dispute creation notification: {}", ex.getMessage());
        }
        return mapToDto(dispute, true);
    }

    /**
     * Attaches an individual photograph to an existing dispute.
     */
    @Transactional
    public DisputePhotoDto uploadPhotoToDispute(UUID disputeId, User user, MultipartFile file, String caption) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        if (!dispute.getSubmittingUser().getId().equals(user.getId()) && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to attach photos to this dispute.");
        }

        long count = disputePhotoRepository.findAllByDisputeIdOrderByCreatedAtAsc(disputeId).size();
        if (count >= MAX_PHOTOS_PER_DISPUTE) {
            throw new BadRequestException("Dispute already contains maximum allowed photos (5).");
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
                .build();
        mediaFile = mediaFileRepository.save(mediaFile);

        String photoUrl = mediaStorageService.generatePresignedGetUrl(upload.objectKey());
        DisputePhoto photo = DisputePhoto.builder()
                .dispute(dispute)
                .mediaFile(mediaFile)
                .objectKey(upload.objectKey())
                .photoUrl(photoUrl)
                .caption(caption != null ? caption : file.getOriginalFilename())
                .build();
        photo = disputePhotoRepository.save(photo);
        dispute.addPhoto(photo);

        return new DisputePhotoDto(photo.getId(), photo.getPhotoUrl(), photo.getCaption(), photo.getCreatedAt());
    }

    /**
     * Retrieves all disputes submitted by the current user.
     */
    @Transactional(readOnly = true)
    public List<DisputeResponseDto> getMyDisputes(User user) {
        List<Dispute> disputes = disputeRepository.findAllBySubmittingUserIdWithDetails(user.getId());
        return disputes.stream().map(d -> mapToDto(d, true)).toList();
    }

    /**
     * Retrieves dispute details by ID with ownership enforcement.
     */
    @Transactional(readOnly = true)
    public DisputeResponseDto getDisputeById(UUID disputeId, User user) {
        Dispute dispute = disputeRepository.findByIdWithDetails(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = dispute.getSubmittingUser().getId().equals(user.getId());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to view this dispute.");
        }

        return mapToDto(dispute, isAdmin);
    }

    /**
     * Admin: Retrieves paginated disputes with optional status filter.
     */
    @Transactional(readOnly = true)
    public Page<DisputeResponseDto> getAdminDisputes(DisputeStatus status, Pageable pageable) {
        Page<Dispute> page;
        if (status != null) {
            page = disputeRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = disputeRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(d -> mapToDto(d, true));
    }

    /**
     * Admin: Assigns dispute review to a moderator.
     */
    @Transactional
    public DisputeResponseDto assignDispute(UUID disputeId, UUID reviewerId, User admin, String notes) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer user not found with id: " + reviewerId));

        dispute.setAssignedReviewer(reviewer);
        if (dispute.getStatus() == DisputeStatus.OPEN) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        }
        dispute = disputeRepository.save(dispute);

        reviewAssignmentRepository.save(ReviewAssignment.builder()
                .targetType("DISPUTE")
                .targetId(dispute.getId())
                .assignedTo(reviewer)
                .assignedBy(admin)
                .status("ASSIGNED")
                .notes(notes)
                .build());

        moderationActionRepository.save(ModerationAction.builder()
                .targetType("DISPUTE")
                .targetId(dispute.getId())
                .action("ASSIGNED_TO_" + reviewer.getEmail())
                .actor(admin)
                .notes(notes)
                .build());

        return mapToDto(dispute, true);
    }

    /**
     * Admin: Updates dispute resolution status with decision notes and optional profile correction.
     */
    @Transactional
    public DisputeResponseDto updateDisputeStatus(UUID disputeId, DisputeStatusUpdateRequest request, User admin) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        DisputeStatus oldStatus = dispute.getStatus();
        DisputeStatus newStatus = request.getStatus();

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new BadRequestException(String.format("Invalid dispute status transition from %s to %s.", oldStatus, newStatus));
        }

        // Reviewer Separation Rule:
        // A moderator cannot resolve a dispute if they were the submitter of the dispute
        if (dispute.getSubmittingUser().getId().equals(admin.getId())) {
            throw new BadRequestException("Reviewer separation policy: You cannot moderate or resolve a dispute you submitted.");
        }

        dispute.setStatus(newStatus);
        dispute.setResolutionNotes(request.getResolutionNotes());
        dispute.setResolvedByUser(admin);
        dispute.setResolvedAt(OffsetDateTime.now());

        // When UPHELD: if admin specifies feature correction, update accessibility profile
        if (newStatus == DisputeStatus.UPHELD && Boolean.TRUE.equals(request.getCorrectAccessibilityProfile())) {
            String fCode = request.getTargetFeatureCode() != null ? request.getTargetFeatureCode() : dispute.getFeatureCode();
            FeatureStatus targetStatus = request.getTargetFeatureStatus();

            if (fCode != null && targetStatus != null) {
                FeatureType featureType = FeatureType.fromCode(fCode);
                if (featureType != null) {
                    Place place = dispute.getPlace();
                    AccessibilityFeature feature = accessibilityFeatureRepository
                            .findByPlaceIdAndFeatureType(place.getId(), featureType)
                            .orElseGet(() -> AccessibilityFeature.builder()
                                    .place(place)
                                    .featureType(featureType)
                                    .build());

                    FeatureStatus oldFStatus = feature.getStatus();
                    feature.setStatus(targetStatus);
                    feature.setLastVerifiedAt(OffsetDateTime.now());
                    feature.setNotes("Corrected via Dispute Resolution: " + dispute.getExplanation());
                    accessibilityFeatureRepository.save(feature);

                    auditLogRepository.save(AccessibilityAuditLog.builder()
                            .place(place)
                            .featureCode(fCode)
                            .oldStatus(oldFStatus)
                            .newStatus(targetStatus)
                            .changedBy(admin)
                            .action("DISPUTE_UPHELD_PROFILE_CORRECTED")
                            .notes(String.format("Dispute ID: %s. Resolution: %s",
                                    dispute.getId(),
                                    request.getResolutionNotes() != null ? request.getResolutionNotes() : "Upheld"))
                            .build());

                    dispute.setProfileCorrected(true);
                    log.info("Dispute {} UPHELD: Place {} feature {} corrected to {}",
                            dispute.getId(), place.getId(), fCode, targetStatus);
                }
            }
        }

        dispute = disputeRepository.save(dispute);

        moderationActionRepository.save(ModerationAction.builder()
                .targetType("DISPUTE")
                .targetId(dispute.getId())
                .action("DISPUTE_STATUS_" + newStatus)
                .actor(admin)
                .notes(request.getResolutionNotes())
                .build());

        log.info("Dispute {} status changed to {} by admin {}", dispute.getId(), newStatus, admin.getEmail());
        try {
            if (newStatus == DisputeStatus.UPHELD || newStatus == DisputeStatus.OVERTURNED || newStatus == DisputeStatus.CLOSED) {
                notificationService.notifyDisputeResolved(dispute);
            }
        } catch (Exception ex) {
            log.warn("Failed to dispatch dispute status update notification: {}", ex.getMessage());
        }
        return mapToDto(dispute, true);
    }

    private DisputeResponseDto mapToDto(Dispute dispute, boolean includeFullUser) {
        List<DisputePhotoDto> photoDtos = new ArrayList<>();
        if (dispute.getPhotos() != null) {
            for (DisputePhoto photo : dispute.getPhotos()) {
                String url = photo.getPhotoUrl();
                if (photo.getObjectKey() != null) {
                    try {
                        url = mediaStorageService.generatePresignedGetUrl(photo.getObjectKey());
                    } catch (Exception ignored) {}
                }
                photoDtos.add(new DisputePhotoDto(photo.getId(), url, photo.getCaption(), photo.getCreatedAt()));
            }
        }

        String userEmail = null;
        String userName = "Community Member";
        if (dispute.getSubmittingUser() != null) {
            userName = dispute.getSubmittingUser().getFullName();
            if (includeFullUser) {
                userEmail = dispute.getSubmittingUser().getEmail();
            } else {
                String raw = dispute.getSubmittingUser().getEmail();
                int atIdx = raw.indexOf('@');
                userEmail = atIdx > 2 ? raw.charAt(0) + "***" + raw.substring(atIdx) : "***@***";
            }
        }

        return DisputeResponseDto.builder()
                .id(dispute.getId())
                .placeId(dispute.getPlace() != null ? dispute.getPlace().getId() : null)
                .placeName(dispute.getPlace() != null ? dispute.getPlace().getName() : null)
                .placeAddress(dispute.getPlace() != null ? dispute.getPlace().getAddress() : null)
                .reportId(dispute.getReport() != null ? dispute.getReport().getId() : null)
                .reportTitle(dispute.getReport() != null ? dispute.getReport().getTitle() : null)
                .observationId(dispute.getObservation() != null ? dispute.getObservation().getId() : null)
                .featureCode(dispute.getFeatureCode())
                .submittingUserId(dispute.getSubmittingUser() != null ? dispute.getSubmittingUser().getId() : null)
                .submittingUserName(userName)
                .submittingUserEmail(userEmail)
                .category(dispute.getCategory())
                .categoryDisplayName(dispute.getCategory() != null ? dispute.getCategory().getDisplayName() : null)
                .explanation(dispute.getExplanation())
                .status(dispute.getStatus())
                .assignedReviewerName(dispute.getAssignedReviewer() != null ? dispute.getAssignedReviewer().getFullName() : null)
                .resolutionNotes(dispute.getResolutionNotes())
                .resolvedByName(dispute.getResolvedByUser() != null ? dispute.getResolvedByUser().getFullName() : null)
                .resolvedAt(dispute.getResolvedAt())
                .profileCorrected(dispute.isProfileCorrected())
                .photos(photoDtos)
                .createdAt(dispute.getCreatedAt())
                .updatedAt(dispute.getUpdatedAt())
                .build();
    }
}

