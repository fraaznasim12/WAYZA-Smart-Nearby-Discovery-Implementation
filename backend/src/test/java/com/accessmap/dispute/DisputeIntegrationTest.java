package com.accessmap.dispute;

import com.accessmap.config.JwtService;
import com.accessmap.dto.DisputeCreateRequest;
import com.accessmap.dto.DisputeStatusUpdateRequest;
import com.accessmap.entity.*;
import com.accessmap.repository.*;
import com.accessmap.service.MediaStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DisputeIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PlaceRepository placeRepository;
    @Autowired AccessibilityReportRepository reportRepository;
    @Autowired ReportPhotoRepository photoRepository;
    @Autowired DisputeRepository disputeRepository;
    @Autowired DisputePhotoRepository disputePhotoRepository;
    @Autowired ModerationActionRepository moderationActionRepository;
    @Autowired ReviewAssignmentRepository reviewAssignmentRepository;
    @Autowired AccessibilityFeatureRepository accessibilityFeatureRepository;
    @Autowired AccessibilityAuditLogRepository auditLogRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    @MockBean
    MediaStorageService mediaStorageService;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User submitter;
    private User otherUser;
    private User admin;
    private User moderator;

    private String submitterToken;
    private String otherUserToken;
    private String adminToken;
    private String moderatorToken;

    private Place testPlace;
    private AccessibilityReport testReport;

    @BeforeEach
    void setUp() {
        disputePhotoRepository.deleteAll();
        disputeRepository.deleteAll();
        reviewAssignmentRepository.deleteAll();
        moderationActionRepository.deleteAll();
        photoRepository.deleteAll();
        reportRepository.deleteAll();
        auditLogRepository.deleteAll();
        accessibilityFeatureRepository.deleteAll();
        placeRepository.deleteAll();
        userRepository.deleteAll();

        submitter = userRepository.save(User.builder()
                .email("disputer@accessmap.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Priya Sharma")
                .role(UserRole.ROLE_USER)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@accessmap.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Rahul Verma")
                .role(UserRole.ROLE_USER)
                .build());

        admin = userRepository.save(User.builder()
                .email("admin@accessmap.local")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .fullName("System Administrator")
                .role(UserRole.ROLE_ADMIN)
                .build());

        moderator = userRepository.save(User.builder()
                .email("moderator@accessmap.local")
                .passwordHash(passwordEncoder.encode("ModPass123!"))
                .fullName("Anita Moderator")
                .role(UserRole.ROLE_ADMIN)
                .build());

        submitterToken = jwtService.generateToken(submitter);
        otherUserToken = jwtService.generateToken(otherUser);
        adminToken = jwtService.generateToken(admin);
        moderatorToken = jwtService.generateToken(moderator);

        Point location = geometryFactory.createPoint(new Coordinate(77.2090, 28.6139));
        testPlace = placeRepository.save(Place.builder()
                .name("Connaught Place Metro Station")
                .address("Rajiv Chowk, Connaught Place, New Delhi")
                .city("New Delhi")
                .state("Delhi")
                .postalCode("110001")
                .geom(location)
                .category("transit_station")
                .build());

        testReport = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(otherUser)
                .category(ReportCategory.INACCESSIBLE_ENTRANCE)
                .issueType("BROKEN_DOOR")
                .title("Gate 2 Automatic Door Jammed")
                .description("Gate 2 automatic door remains locked during peak hours.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.APPROVED)
                .build());

        // Baseline feature
        accessibilityFeatureRepository.save(AccessibilityFeature.builder()
                .place(testPlace)
                .featureType(FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .status(FeatureStatus.NOT_AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(10))
                .notes("Verified defective entrance")
                .build());

        when(mediaStorageService.uploadReportEvidence(any())).thenReturn(
                new MediaStorageService.UploadResult(
                        "disputes/test-photo.jpg",
                        "accessmap-media",
                        "image/jpeg",
                        1024L,
                        "sha256checksum"
                )
        );
        when(mediaStorageService.generatePresignedGetUrl(any())).thenReturn("https://minio.local/presigned/test-photo.jpg");
    }

    @Test
    @DisplayName("Submit Dispute JSON: Authenticated user creates dispute successfully")
    void testCreateDisputeJson_Success() throws Exception {
        DisputeCreateRequest request = DisputeCreateRequest.builder()
                .placeId(testPlace.getId())
                .reportId(testReport.getId())
                .featureCode("WHEELCHAIR_ACCESSIBLE_ENTRANCE")
                .category(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO)
                .explanation("The entrance ramp and automatic doors at Gate 2 have been completely repaired as of yesterday.")
                .build();

        mockMvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + submitterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.placeId").value(testPlace.getId().toString()))
                .andExpect(jsonPath("$.data.category").value("INCORRECT_ACCESSIBILITY_INFO"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.submittingUserName").value("Priya Sharma"));

        List<Dispute> disputes = disputeRepository.findAll();
        assertThat(disputes).hasSize(1);
        assertThat(disputes.get(0).getExplanation()).contains("Gate 2 have been completely repaired");

        // Approved report disputed -> status should transition to DISPUTED
        AccessibilityReport updatedReport = reportRepository.findById(testReport.getId()).orElseThrow();
        assertThat(updatedReport.getStatus()).isEqualTo(ReportStatus.DISPUTED);
    }

    @Test
    @DisplayName("Submit Dispute Multipart: Authenticated user uploads dispute with photos")
    void testCreateDisputeMultipart_Success() throws Exception {
        DisputeCreateRequest request = DisputeCreateRequest.builder()
                .placeId(testPlace.getId())
                .featureCode("ENTRANCE_RAMP")
                .category(DisputeCategory.OUTDATED_FACILITY_INFO)
                .explanation("Brand new entrance ramp with handrails was inaugurated last week.")
                .build();

        MockMultipartFile jsonPart = new MockMultipartFile(
                "dispute",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        MockMultipartFile photoPart = new MockMultipartFile(
                "files",
                "ramp_evidence.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3, 4, 5}
        );

        mockMvc.perform(multipart("/api/v1/disputes")
                        .file(jsonPart)
                        .file(photoPart)
                        .header("Authorization", "Bearer " + submitterToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.photos", hasSize(1)))
                .andExpect(jsonPath("$.data.photos[0].photoUrl").value("https://minio.local/presigned/test-photo.jpg"));

        List<DisputePhoto> photos = disputePhotoRepository.findAll();
        assertThat(photos).hasSize(1);
    }

    @Test
    @DisplayName("Duplicate dispute prevention: Returns 400 when an active dispute exists for same feature")
    void testDuplicateDispute_Blocked() throws Exception {
        disputeRepository.save(Dispute.builder()
                .place(testPlace)
                .featureCode("WHEELCHAIR_ACCESSIBLE_ENTRANCE")
                .submittingUser(otherUser)
                .category(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO)
                .explanation("Active dispute ongoing")
                .status(DisputeStatus.OPEN)
                .build());

        DisputeCreateRequest duplicateRequest = DisputeCreateRequest.builder()
                .placeId(testPlace.getId())
                .featureCode("WHEELCHAIR_ACCESSIBLE_ENTRANCE")
                .category(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO)
                .explanation("Second dispute for same feature while first is open")
                .build();

        mockMvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + submitterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message", containsString("already being reviewed")));
    }

    @Test
    @DisplayName("User dispute access: Submitter can view own disputes, but other user is 403 Forbidden")
    void testDisputeAccessControl() throws Exception {
        Dispute dispute = disputeRepository.save(Dispute.builder()
                .place(testPlace)
                .featureCode("ELEVATOR_AVAILABILITY")
                .submittingUser(submitter)
                .category(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO)
                .explanation("Private dispute submission")
                .status(DisputeStatus.OPEN)
                .build());

        // Submitter can fetch via /api/v1/disputes/me
        mockMvc.perform(get("/api/v1/disputes/me")
                        .header("Authorization", "Bearer " + submitterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(dispute.getId().toString()));

        // Submitter can fetch single dispute
        mockMvc.perform(get("/api/v1/disputes/" + dispute.getId())
                        .header("Authorization", "Bearer " + submitterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(dispute.getId().toString()));

        // Other regular user is forbidden (403)
        mockMvc.perform(get("/api/v1/disputes/" + dispute.getId())
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin Dispute Assignment: Admin assigns review to moderator")
    void testAdminAssignDispute() throws Exception {
        Dispute dispute = disputeRepository.save(Dispute.builder()
                .place(testPlace)
                .featureCode("HANDRAILS")
                .submittingUser(submitter)
                .category(DisputeCategory.OUTDATED_FACILITY_INFO)
                .explanation("Needs site verification")
                .status(DisputeStatus.OPEN)
                .build());

        mockMvc.perform(post("/api/v1/admin/disputes/" + dispute.getId() + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("reviewerId", moderator.getId().toString())
                        .param("notes", "Please inspect Rajiv Chowk Gate 2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignedReviewerName").value("Anita Moderator"))
                .andExpect(jsonPath("$.data.status").value("UNDER_REVIEW"));

        List<ReviewAssignment> assignments = reviewAssignmentRepository.findAll();
        assertThat(assignments).hasSize(1);
        assertThat(assignments.get(0).getAssignedTo().getId()).isEqualTo(moderator.getId());
    }

    @Test
    @DisplayName("Admin Resolution: UPHELD dispute with profile correction updates place feature")
    void testAdminResolveDispute_UpheldWithProfileCorrection() throws Exception {
        Dispute dispute = disputeRepository.save(Dispute.builder()
                .place(testPlace)
                .featureCode("WHEELCHAIR_ACCESSIBLE_ENTRANCE")
                .submittingUser(submitter)
                .category(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO)
                .explanation("Entrance ramp is now fully accessible")
                .status(DisputeStatus.UNDER_REVIEW)
                .build());

        DisputeStatusUpdateRequest updateRequest = DisputeStatusUpdateRequest.builder()
                .status(DisputeStatus.UPHELD)
                .resolutionNotes("Verified on-site: New high-capacity ramp and automatic sliding doors are functional.")
                .correctAccessibilityProfile(true)
                .targetFeatureCode("WHEELCHAIR_ACCESSIBLE_ENTRANCE")
                .targetFeatureStatus(FeatureStatus.AVAILABLE)
                .build();

        mockMvc.perform(patch("/api/v1/admin/disputes/" + dispute.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UPHELD"))
                .andExpect(jsonPath("$.data.profileCorrected").value(true));

        // Verify that the feature is now AVAILABLE
        AccessibilityFeature feature = accessibilityFeatureRepository
                .findByPlaceIdAndFeatureType(testPlace.getId(), FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .orElseThrow();
        assertThat(feature.getStatus()).isEqualTo(FeatureStatus.AVAILABLE);

        // Verify audit log created
        List<AccessibilityAuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).isNotEmpty();
        assertThat(logs.get(0).getAction()).isEqualTo("DISPUTE_UPHELD_PROFILE_CORRECTED");
    }

    @Test
    @DisplayName("Reviewer Separation Policy: Submitter cannot resolve own dispute even with admin role")
    void testReviewerSeparationPolicy() throws Exception {
        // Create an admin user who also submits a dispute
        User submitterAdmin = userRepository.save(User.builder()
                .email("admin_submitter@accessmap.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Self Reviewer")
                .role(UserRole.ROLE_ADMIN)
                .build());
        String selfToken = jwtService.generateToken(submitterAdmin);

        Dispute dispute = disputeRepository.save(Dispute.builder()
                .place(testPlace)
                .featureCode("ACCESSIBLE_PARKING")
                .submittingUser(submitterAdmin)
                .category(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO)
                .explanation("Self-submitted dispute")
                .status(DisputeStatus.UNDER_REVIEW)
                .build());

        DisputeStatusUpdateRequest updateRequest = DisputeStatusUpdateRequest.builder()
                .status(DisputeStatus.UPHELD)
                .resolutionNotes("Resolving my own dispute")
                .build();

        mockMvc.perform(patch("/api/v1/admin/disputes/" + dispute.getId() + "/status")
                        .header("Authorization", "Bearer " + selfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message", containsString("separation policy")));
    }

    @Test
    @DisplayName("Evidence Review Conflict Detection: Detects baseline conflict against existing feature")
    void testConflictDetection() throws Exception {
        // Set baseline to AVAILABLE so report creates a conflict
        AccessibilityFeature entranceFeature = accessibilityFeatureRepository
                .findByPlaceIdAndFeatureType(testPlace.getId(), FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .orElseThrow();
        entranceFeature.setStatus(FeatureStatus.AVAILABLE);
        accessibilityFeatureRepository.save(entranceFeature);

        mockMvc.perform(get("/api/v1/admin/reports/" + testReport.getId() + "/conflicts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasConflict").value(true))
                .andExpect(jsonPath("$.data.currentFeatureStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.conflictDescription", containsString("Conflict detected")));
    }

    @Test
    @DisplayName("Place Freshness Audit: Accurately reports fresh/stale breakdown without status changes")
    void testPlaceFreshnessEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/places/" + testPlace.getId() + "/freshness")
                        .param("thresholdDays", "90"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.placeId").value(testPlace.getId().toString()))
                .andExpect(jsonPath("$.data.freshnessThresholdDays").value(90))
                .andExpect(jsonPath("$.data.features").isArray())
                .andExpect(jsonPath("$.data.freshCount").isNumber())
                .andExpect(jsonPath("$.data.staleCount").isNumber());

        // Feature status should remain unchanged
        AccessibilityFeature feature = accessibilityFeatureRepository
                .findByPlaceIdAndFeatureType(testPlace.getId(), FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .orElseThrow();
        assertThat(feature.getStatus()).isEqualTo(FeatureStatus.NOT_AVAILABLE);
    }
}

