package com.accessmap.service;

import com.accessmap.dto.*;
import com.accessmap.entity.*;
import com.accessmap.exception.BadRequestException;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessibilityService {

    private final FeatureDefinitionRepository featureDefinitionRepository;
    private final AccessibilityFeatureRepository accessibilityFeatureRepository;
    private final ObservationSubmissionRepository observationSubmissionRepository;
    private final PlaceOwnershipRepository placeOwnershipRepository;
    private final PlaceRepository placeRepository;
    private final AccessibilityAuditLogRepository accessibilityAuditLogRepository;
    private final MediaStorageService mediaStorageService;
    private final MediaFileRepository mediaFileRepository;
    private final NotificationService notificationService;

    @Value("${accessmap.verification.staleness-threshold-days:180}")
    private int stalenessThresholdDays;

    /**
     * Standard 21 accessibility features seed list for environments where Flyway V6
     * has not executed (e.g., in-memory H2 unit/integration tests).
     */
    private static final List<FeatureDefinition> DEFAULT_CATALOGUE = List.of(
            // ENTRANCE
            FeatureDefinition.builder().code("WHEELCHAIR_ACCESSIBLE_ENTRANCE").category("ENTRANCE").name("Wheelchair-accessible entrance").description("Primary or dedicated level entrance accessible to wheeled mobility devices.").icon("Accessibility").displayOrder(1).isActive(true).build(),
            FeatureDefinition.builder().code("STEP_FREE_ENTRANCE").category("ENTRANCE").name("Step-free entrance").description("Entrance with zero steps or level threshold transitions under 1/2 inch.").icon("DoorOpen").displayOrder(2).isActive(true).build(),
            FeatureDefinition.builder().code("ENTRANCE_RAMP").category("ENTRANCE").name("Entrance ramp").description("Permanent ramp with maximum 1:12 slope and sturdy dual handrails.").icon("ArrowUpRight").displayOrder(3).isActive(true).build(),
            FeatureDefinition.builder().code("AUTOMATIC_DOORS").category("ENTRANCE").name("Automatic doors").description("Motion sensor or push-button power-assisted entrance doors.").icon("Maximize2").displayOrder(4).isActive(true).build(),
            FeatureDefinition.builder().code("DOORWAY_ACCESSIBILITY_INFO").category("ENTRANCE").name("Doorway accessibility information").description("Clear opening width of at least 32 inches (815mm) with low-resistance opening force.").icon("Info").displayOrder(5).isActive(true).build(),

            // VERTICAL ACCESS
            FeatureDefinition.builder().code("ELEVATOR_AVAILABILITY").category("VERTICAL_ACCESS").name("Elevator availability").description("Functioning passenger elevator serving all public and commercial floors.").icon("ArrowUpDown").displayOrder(6).isActive(true).build(),
            FeatureDefinition.builder().code("ELEVATOR_ACCESSIBILITY").category("VERTICAL_ACCESS").name("Elevator accessibility").description("Braille buttons, audible floor announcements, and minimum cab dimensions for wheelchairs.").icon("Layers").displayOrder(7).isActive(true).build(),
            FeatureDefinition.builder().code("STAIR_FREE_ACCESS").category("VERTICAL_ACCESS").name("Stair-free access").description("Complete continuous pathways between levels without requiring stair traversal.").icon("Footprints").displayOrder(8).isActive(true).build(),
            FeatureDefinition.builder().code("HANDRAILS").category("VERTICAL_ACCESS").name("Handrails").description("Continuous handrails on both sides of all access ramps and stairways.").icon("GitCommit").displayOrder(9).isActive(true).build(),

            // RESTROOM
            FeatureDefinition.builder().code("ACCESSIBLE_WASHROOM").category("RESTROOM").name("Accessible washroom").description("Designated washroom with wheelchair turning radius of 60 inches minimum.").icon("Bath").displayOrder(10).isActive(true).build(),
            FeatureDefinition.builder().code("WHEELCHAIR_ACCESSIBLE_RESTROOM").category("RESTROOM").name("Wheelchair-accessible restroom").description("Equipped with reinforced grab bars, roll-under sink, and accessible locks.").icon("ShieldCheck").displayOrder(11).isActive(true).build(),
            FeatureDefinition.builder().code("ACCESSIBLE_RESTROOM_SIGNAGE").category("RESTROOM").name("Accessible restroom signage").description("High-contrast directional signage and tactile braille restroom indicators.").icon("Signpost").displayOrder(12).isActive(true).build(),

            // PARKING
            FeatureDefinition.builder().code("ACCESSIBLE_PARKING").category("PARKING").name("Accessible parking").description("Dedicated accessible parking stalls located near primary accessible entrances.").icon("Car").displayOrder(13).isActive(true).build(),
            FeatureDefinition.builder().code("RESERVED_WHEELCHAIR_PARKING").category("PARKING").name("Reserved wheelchair parking").description("Extra-wide van-accessible parking spaces with striped access aisles.").icon("CircleParking").displayOrder(14).isActive(true).build(),

            // PATHWAYS
            FeatureDefinition.builder().code("WHEELCHAIR_ACCESSIBLE_PATHWAYS").category("PATHWAYS").name("Wheelchair-accessible pathways").description("Paved, unobstructed interior and exterior pathways at least 36 inches wide.").icon("Navigation").displayOrder(15).isActive(true).build(),
            FeatureDefinition.builder().code("ACCESSIBLE_RECEPTION_COUNTERS").category("PATHWAYS").name("Accessible reception counters").description("Service or reception counter section at or below 34 inches (865mm) height.").icon("CreditCard").displayOrder(16).isActive(true).build(),
            FeatureDefinition.builder().code("ACCESSIBLE_SEATING").category("PATHWAYS").name("Accessible seating").description("Designated companion and wheelchair-integrated seating spaces in waiting/dining areas.").icon("Armchair").displayOrder(17).isActive(true).build(),

            // ADDITIONAL
            FeatureDefinition.builder().code("BRAILLE_SIGNAGE").category("ADDITIONAL").name("Braille signage").description("Standard Grade 2 tactile and braille room and service location signs.").icon("Binary").displayOrder(18).isActive(true).build(),
            FeatureDefinition.builder().code("TACTILE_INDICATORS").category("ADDITIONAL").name("Tactile indicators").description("Ground surface tactile paving tiles warning of hazards, platforms, and curbs.").icon("Grid").displayOrder(19).isActive(true).build(),
            FeatureDefinition.builder().code("AUDIO_ASSISTANCE").category("ADDITIONAL").name("Audio assistance").description("Hearing induction loops, audio beacons, or assistive listening systems installed.").icon("Volume2").displayOrder(20).isActive(true).build(),
            FeatureDefinition.builder().code("STAFF_ASSISTANCE").category("ADDITIONAL").name("Staff assistance").description("Staff trained in accessibility accommodations and guided assistance available on-site.").icon("Users").displayOrder(21).isActive(true).build()
    );

    /**
     * Retrieves the complete accessibility feature catalogue.
     */
    @Transactional
    public List<FeatureDefinitionDto> getFeatureCatalog() {
        List<FeatureDefinition> defs = featureDefinitionRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc();
        if (defs.isEmpty()) {
            featureDefinitionRepository.saveAll(DEFAULT_CATALOGUE);
            defs = featureDefinitionRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc();
        }
        return defs.stream()
                .map(d -> new FeatureDefinitionDto(
                        d.getCode(),
                        d.getCategory(),
                        d.getName(),
                        d.getDescription(),
                        d.getIcon(),
                        d.getDisplayOrder()
                ))
                .toList();
    }

    /**
     * Retrieves a place's aggregated accessibility profile with four-state counts.
     * Missing features default strictly to UNKNOWN.
     */
    @Transactional(readOnly = true)
    public AccessibilityProfileDto getPlaceAccessibilityProfile(UUID placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        List<FeatureDefinition> catalog = featureDefinitionRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc();
        if (catalog.isEmpty()) {
            catalog = DEFAULT_CATALOGUE;
        }

        List<AccessibilityFeature> recordedFeatures = accessibilityFeatureRepository.findAllByPlaceId(placeId);
        Map<String, AccessibilityFeature> featureMap = new HashMap<>();
        for (AccessibilityFeature af : recordedFeatures) {
            if (af.getFeatureType() != null) {
                featureMap.put(af.getFeatureType().name(), af);
            }
        }

        int available = 0;
        int notAvailable = 0;
        int unknown = 0;
        int notVerified = 0;
        OffsetDateTime latestVerification = null;

        List<FeatureStatusDto> featureStatusDtos = new ArrayList<>();

        for (FeatureDefinition def : catalog) {
            AccessibilityFeature recorded = featureMap.get(def.getCode());

            FeatureStatus effectiveStatus;
            String notes = null;
            OffsetDateTime verifiedAt = null;

            if (recorded == null) {
                // RULE: Missing information is strictly UNKNOWN
                effectiveStatus = FeatureStatus.UNKNOWN;
            } else {
                notes = recorded.getNotes();
                verifiedAt = recorded.getLastVerifiedAt();
                effectiveStatus = computeEffectiveStatus(recorded);
            }

            switch (effectiveStatus) {
                case AVAILABLE -> available++;
                case NOT_AVAILABLE -> notAvailable++;
                case UNKNOWN -> unknown++;
                case NOT_VERIFIED -> notVerified++;
            }

            if (verifiedAt != null && (latestVerification == null || verifiedAt.isAfter(latestVerification))) {
                latestVerification = verifiedAt;
            }

            featureStatusDtos.add(new FeatureStatusDto(
                    def.getCode(),
                    def.getName(),
                    def.getCategory(),
                    def.getDescription(),
                    def.getIcon(),
                    effectiveStatus,
                    notes,
                    verifiedAt
            ));
        }

        long pendingCount = observationSubmissionRepository.countByPlaceIdAndVerificationStatus(
                placeId, ObservationVerificationStatus.PENDING
        );

        List<ObservationSubmission> recentObs = observationSubmissionRepository.findAllByPlaceIdOrderByCreatedAtDesc(placeId);
        List<ObservationSubmissionDto> recentObsDtos = recentObs.stream()
                .limit(5)
                .map(this::toSubmissionDto)
                .toList();

        return new AccessibilityProfileDto(
                place.getId(),
                place.getName(),
                available,
                notAvailable,
                unknown,
                notVerified,
                catalog.size(),
                latestVerification,
                pendingCount,
                featureStatusDtos,
                recentObsDtos
        );
    }

    /**
     * Retrieves a lightweight accessibility summary for a place, including
     * four-state counts and overall percentage score.
     */
    @Transactional(readOnly = true)
    public AccessibilitySummaryDto getPlaceAccessibilitySummary(UUID placeId) {
        AccessibilityProfileDto profile = getPlaceAccessibilityProfile(placeId);

        int total = profile.totalTrackedFeatures();
        double score = total > 0 ? Math.round(((double) profile.availableCount() / total) * 1000.0) / 10.0 : 0.0;

        String overallStatus = "UNKNOWN";
        if (profile.availableCount() >= 5) {
            overallStatus = "AVAILABLE";
        } else if (profile.notAvailableCount() > 5) {
            overallStatus = "NOT_AVAILABLE";
        } else if (profile.notVerifiedCount() > 0) {
            overallStatus = "NOT_VERIFIED";
        }

        Map<String, Integer> catCounts = new HashMap<>();
        for (FeatureStatusDto f : profile.features()) {
            if (f.status() == FeatureStatus.AVAILABLE) {
                catCounts.merge(f.category(), 1, Integer::sum);
            }
        }

        return new AccessibilitySummaryDto(
                placeId,
                profile.placeName(),
                overallStatus,
                profile.availableCount(),
                profile.notAvailableCount(),
                profile.unknownCount(),
                profile.notVerifiedCount(),
                total,
                score,
                profile.lastVerifiedAt(),
                catCounts
        );
    }

    /**
     * Submits an observation report. Enforces RBAC and business ownership rules.
     */
    @Transactional
    public ObservationSubmissionDto submitObservation(UUID placeId, User currentUser, ObservationSubmitRequest request) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        SubmissionType submissionType = SubmissionType.COMMUNITY;

        // Business owner authorization verification
        if (currentUser.getRole() == UserRole.ROLE_BUSINESS_OWNER) {
            boolean isOwner = placeOwnershipRepository.existsByPlaceIdAndUserIdAndIsVerifiedTrue(placeId, currentUser.getId());
            if (!isOwner) {
                throw new AccessDeniedException("Business owners may only submit updates for places they own and have verified ownership of");
            }
            submissionType = SubmissionType.BUSINESS_OWNER;
        } else if (currentUser.getRole() == UserRole.ROLE_ADMIN) {
            submissionType = SubmissionType.ADMIN;
        }

        // Validate evidence URLs
        if (request.evidence() != null) {
            for (ObservationEvidenceSubmitRequest ev : request.evidence()) {
                validateImageUrl(ev.imageUrl());
            }
        }

        ObservationSubmission submission = ObservationSubmission.builder()
                .place(place)
                .submittedBy(currentUser)
                .submissionType(submissionType)
                .verificationStatus(ObservationVerificationStatus.PENDING)
                .observationDate(request.observationDate() != null ? request.observationDate() : OffsetDateTime.now())
                .description(request.description())
                .items(new ArrayList<>())
                .evidence(new ArrayList<>())
                .build();

        if (request.items() != null) {
            for (ObservationItemSubmitRequest itemReq : request.items()) {
                submission.getItems().add(ObservationSubmissionItem.builder()
                        .submission(submission)
                        .featureCode(itemReq.featureCode().trim().toUpperCase())
                        .status(itemReq.status())
                        .notes(itemReq.notes())
                        .build());
            }
        }

        if (request.evidence() != null) {
            for (ObservationEvidenceSubmitRequest evReq : request.evidence()) {
                submission.getEvidence().add(ObservationEvidence.builder()
                        .submission(submission)
                        .imageUrl(evReq.imageUrl())
                        .caption(evReq.caption())
                        .featureCode(evReq.featureCode() != null ? evReq.featureCode().trim().toUpperCase() : null)
                        .build());
            }
        }

        ObservationSubmission saved = observationSubmissionRepository.save(submission);
        log.info("New observation submission {} created for place {} by {}", saved.getId(), placeId, currentUser.getEmail());
        return toSubmissionDto(saved);
    }

    /**
     * Lists all observations for a place.
     */
    @Transactional(readOnly = true)
    public List<ObservationSubmissionDto> getPlaceObservations(UUID placeId) {
        if (!placeRepository.existsById(placeId)) {
            throw new ResourceNotFoundException("Place not found with id: " + placeId);
        }
        return observationSubmissionRepository.findAllByPlaceIdOrderByCreatedAtDesc(placeId).stream()
                .map(this::toSubmissionDto)
                .toList();
    }

    /**
     * Admin review queue listing.
     */
    @Transactional(readOnly = true)
    public Page<ObservationSubmissionDto> getAdminObservations(ObservationVerificationStatus status, Pageable pageable) {
        Page<ObservationSubmission> page;
        if (status != null) {
            page = observationSubmissionRepository.findAllByVerificationStatus(status, pageable);
        } else {
            page = observationSubmissionRepository.findAll(pageable);
        }
        return page.map(this::toSubmissionDto);
    }

    /**
     * Admin review decision execution.
     * Approving an observation updates the official AccessibilityFeature records.
     * Rejecting retains the audit record with the rejection reason.
     */
    @Transactional
    public ObservationSubmissionDto reviewObservation(UUID submissionId, User adminUser, ObservationReviewRequest request) {
        ObservationSubmission submission = observationSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Observation submission not found with id: " + submissionId));

        submission.setReviewedBy(adminUser);
        submission.setReviewedAt(OffsetDateTime.now());
        submission.setReviewNotes(request.reviewNotes());
        submission.setVerificationStatus(request.decision());

        if (request.decision() == ObservationVerificationStatus.APPROVED) {
            Place place = submission.getPlace();
            OffsetDateTime auditDate = submission.getObservationDate() != null ? submission.getObservationDate() : OffsetDateTime.now();

            for (ObservationSubmissionItem item : submission.getItems()) {
                FeatureType featureType = FeatureType.fromCode(item.getFeatureCode());
                if (featureType == null) {
                    continue; // Skip unknown features
                }

                AccessibilityFeature feature = accessibilityFeatureRepository.findByPlaceIdAndFeatureType(place.getId(), featureType)
                        .orElseGet(() -> AccessibilityFeature.builder()
                                .place(place)
                                .featureType(featureType)
                                .build());

                FeatureStatus oldStatus = feature.getStatus();
                feature.setStatus(item.getStatus());
                if (item.getNotes() != null && !item.getNotes().isBlank()) {
                    feature.setNotes(item.getNotes());
                }
                feature.setLastVerifiedAt(auditDate);
                accessibilityFeatureRepository.save(feature);

                // Record audit log for each updated feature
                accessibilityAuditLogRepository.save(AccessibilityAuditLog.builder()
                        .place(place)
                        .featureCode(item.getFeatureCode())
                        .oldStatus(oldStatus)
                        .newStatus(item.getStatus())
                        .changedBy(adminUser)
                        .observation(submission)
                        .action("OBSERVATION_APPROVED")
                        .notes(request.reviewNotes())
                        .build());
            }
            log.info("Observation submission {} APPROVED by admin {}. Place {} features updated.",
                    submissionId, adminUser.getEmail(), place.getId());
            try {
                notificationService.sendNotification(
                        submission.getSubmittedBy(),
                        NotificationType.REPORT_APPROVED,
                        "Observation Verified",
                        "Your accessibility observation for " + place.getName() + " was reviewed and approved.",
                        "OBSERVATION",
                        submission.getId(),
                        null
                );
                notificationService.notifyProfileUpdated(place, "Facility Features");
            } catch (Exception ex) {
                log.warn("Failed to dispatch observation approval notification: {}", ex.getMessage());
            }
        } else {
            // Record audit log on rejection
            accessibilityAuditLogRepository.save(AccessibilityAuditLog.builder()
                    .place(submission.getPlace())
                    .featureCode("ALL")
                    .oldStatus(null)
                    .newStatus(FeatureStatus.UNKNOWN)
                    .changedBy(adminUser)
                    .observation(submission)
                    .action("OBSERVATION_REJECTED")
                    .notes(request.reviewNotes())
                    .build());

            log.info("Observation submission {} REJECTED by admin {}. Audit history preserved.",
                    submissionId, adminUser.getEmail());
            try {
                notificationService.sendNotification(
                        submission.getSubmittedBy(),
                        NotificationType.REPORT_REJECTED,
                        "Observation Review Decision",
                        "Your accessibility observation for " + submission.getPlace().getName() + " could not be approved" +
                                (request.reviewNotes() != null ? ": " + request.reviewNotes() : "."),
                        "OBSERVATION",
                        submission.getId(),
                        null
                );
            } catch (Exception ex) {
                log.warn("Failed to dispatch observation rejection notification: {}", ex.getMessage());
            }
        }

        ObservationSubmission updated = observationSubmissionRepository.save(submission);
        return toSubmissionDto(updated);
    }

    /**
     * Dedicated approval helper.
     */
    @Transactional
    public ObservationSubmissionDto approveObservation(UUID submissionId, User adminUser, String notes) {
        return reviewObservation(submissionId, adminUser,
                new ObservationReviewRequest(ObservationVerificationStatus.APPROVED, notes != null ? notes : "Approved by administrator"));
    }

    /**
     * Dedicated rejection helper.
     */
    @Transactional
    public ObservationSubmissionDto rejectObservation(UUID submissionId, User adminUser, String notes) {
        return reviewObservation(submissionId, adminUser,
                new ObservationReviewRequest(ObservationVerificationStatus.REJECTED, notes != null ? notes : "Rejected by administrator"));
    }

    /**
     * Retrieves observations submitted by the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<ObservationSubmissionDto> getMyObservations(User currentUser) {
        return observationSubmissionRepository.findAllBySubmittedByIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toSubmissionDto)
                .toList();
    }

    /**
     * Uploads an observation evidence photo to MinIO / S3 object storage.
     * Re-encodes the image to strip EXIF GPS metadata and marks visibility as PENDING_REVIEW.
     */
    @Transactional
    public ObservationEvidenceDto uploadObservationEvidence(
            UUID placeId,
            User currentUser,
            org.springframework.web.multipart.MultipartFile file,
            String caption,
            String featureCode
    ) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        MediaStorageService.UploadResult result = mediaStorageService.uploadReportEvidence(file);

        MediaFile mediaFile = MediaFile.builder()
                .owner(currentUser)
                .purpose("REPORT_EVIDENCE")
                .objectKey(result.objectKey())
                .bucketName(result.bucketName())
                .mimeType(result.mimeType())
                .fileSizeBytes(result.fileSizeBytes())
                .checksumSha256(result.checksumSha256())
                .visibility("PENDING_REVIEW")
                .build();
        MediaFile saved = mediaFileRepository.save(mediaFile);

        String accessUrl = mediaStorageService.generatePresignedGetUrl(result.objectKey());
        return new ObservationEvidenceDto(
                saved.getId(),
                accessUrl,
                caption,
                featureCode,
                saved.getUploadedAt()
        );
    }

    /**
     * Business owner registers a claim on a venue.
     */
    @Transactional
    public PlaceOwnershipDto claimPlaceOwnership(UUID placeId, User businessOwner) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        Optional<PlaceOwnership> existing = placeOwnershipRepository.findByPlaceAndUser(place, businessOwner);
        if (existing.isPresent()) {
            return toOwnershipDto(existing.get());
        }

        PlaceOwnership ownership = PlaceOwnership.builder()
                .place(place)
                .user(businessOwner)
                .isVerified(false)
                .build();

        PlaceOwnership saved = placeOwnershipRepository.save(ownership);
        try {
            notificationService.notifyClaimSubmitted(saved);
        } catch (Exception ex) {
            log.warn("Failed to dispatch claim submitted notification: {}", ex.getMessage());
        }
        return toOwnershipDto(saved);
    }

    /**
     * Admin approves or revokes business venue ownership.
     */
    @Transactional
    public PlaceOwnershipDto verifyPlaceOwnership(UUID ownershipId, User adminUser, boolean isVerified) {
        PlaceOwnership ownership = placeOwnershipRepository.findById(ownershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Ownership record not found with id: " + ownershipId));

        ownership.setIsVerified(isVerified);
        ownership.setVerifiedAt(isVerified ? OffsetDateTime.now() : null);
        PlaceOwnership saved = placeOwnershipRepository.save(ownership);
        try {
            notificationService.notifyClaimReviewed(saved, isVerified, isVerified ? "Ownership verified" : "Ownership revoked");
        } catch (Exception ex) {
            log.warn("Failed to dispatch claim review notification: {}", ex.getMessage());
        }
        return toOwnershipDto(saved);
    }

    public FeatureStatus computeEffectiveStatus(AccessibilityFeature feature) {
        if (feature.getStatus() == FeatureStatus.UNKNOWN) {
            return FeatureStatus.UNKNOWN;
        }
        if (feature.getStatus() == FeatureStatus.NOT_VERIFIED) {
            return FeatureStatus.NOT_VERIFIED;
        }
        OffsetDateTime verifiedAt = feature.getLastVerifiedAt();
        if (verifiedAt == null) {
            return FeatureStatus.NOT_VERIFIED;
        }
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(stalenessThresholdDays);
        if (verifiedAt.isBefore(cutoff)) {
            return FeatureStatus.NOT_VERIFIED;
        }
        return feature.getStatus();
    }

    private void validateImageUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new BadRequestException("Image URL cannot be empty");
        }
        String clean = url.trim().toLowerCase();
        if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("data:image/")) {
            throw new BadRequestException("Image URL must use http, https, or data:image scheme");
        }
    }

    public ObservationSubmissionDto toSubmissionDto(ObservationSubmission s) {
        List<ObservationItemDto> itemDtos = s.getItems() != null ? s.getItems().stream()
                .map(i -> new ObservationItemDto(i.getId(), i.getFeatureCode(), i.getStatus(), i.getNotes()))
                .toList() : List.of();

        List<ObservationEvidenceDto> evidenceDtos = s.getEvidence() != null ? s.getEvidence().stream()
                .map(e -> new ObservationEvidenceDto(e.getId(), e.getImageUrl(), e.getCaption(), e.getFeatureCode(), e.getUploadedAt()))
                .toList() : List.of();

        return new ObservationSubmissionDto(
                s.getId(),
                s.getPlace() != null ? s.getPlace().getId() : null,
                s.getPlace() != null ? s.getPlace().getName() : null,
                s.getSubmittedBy() != null ? s.getSubmittedBy().getId() : null,
                s.getSubmittedBy() != null ? s.getSubmittedBy().getFullName() : null,
                s.getSubmissionType(),
                s.getVerificationStatus(),
                s.getObservationDate(),
                s.getDescription(),
                s.getReviewedBy() != null ? s.getReviewedBy().getId() : null,
                s.getReviewedBy() != null ? s.getReviewedBy().getFullName() : null,
                s.getReviewedAt(),
                s.getReviewNotes(),
                s.getCreatedAt(),
                itemDtos,
                evidenceDtos
        );
    }

    public PlaceOwnershipDto toOwnershipDto(PlaceOwnership po) {
        return new PlaceOwnershipDto(
                po.getId(),
                po.getPlace() != null ? po.getPlace().getId() : null,
                po.getPlace() != null ? po.getPlace().getName() : null,
                po.getUser() != null ? po.getUser().getId() : null,
                po.getUser() != null ? po.getUser().getEmail() : null,
                po.getUser() != null ? po.getUser().getFullName() : null,
                po.getIsVerified(),
                po.getVerifiedAt(),
                po.getCreatedAt()
        );
    }
}

