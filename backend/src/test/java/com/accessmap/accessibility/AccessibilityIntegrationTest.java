package com.accessmap.accessibility;

import com.accessmap.config.JwtService;
import com.accessmap.dto.ObservationEvidenceSubmitRequest;
import com.accessmap.dto.ObservationItemSubmitRequest;
import com.accessmap.dto.ObservationReviewRequest;
import com.accessmap.dto.ObservationSubmitRequest;
import com.accessmap.entity.*;
import com.accessmap.repository.*;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccessibilityIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PlaceRepository placeRepository;
    @Autowired UserRepository userRepository;
    @Autowired PlaceOwnershipRepository placeOwnershipRepository;
    @Autowired AccessibilityFeatureRepository accessibilityFeatureRepository;
    @Autowired ObservationSubmissionRepository observationSubmissionRepository;
    @Autowired FeatureDefinitionRepository featureDefinitionRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    @Autowired AccessibilityAuditLogRepository accessibilityAuditLogRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User regularUser;
    private User businessOwnerUser;
    private User adminUser;

    private String userToken;
    private String businessOwnerToken;
    private String adminToken;

    private Place sampleHospital;

    @BeforeEach
    void setUp() {
        accessibilityAuditLogRepository.deleteAll();
        observationSubmissionRepository.deleteAll();
        placeOwnershipRepository.deleteAll();
        accessibilityFeatureRepository.deleteAll();
        placeRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Regular User
        regularUser = userRepository.save(User.builder()
                .email("regular@accessmap.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Regular User")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());
        userToken = jwtService.generateToken(regularUser);

        // 2. Business Owner User
        businessOwnerUser = userRepository.save(User.builder()
                .email("owner@business.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Business Owner")
                .role(UserRole.ROLE_BUSINESS_OWNER)
                .isEnabled(true)
                .build());
        businessOwnerToken = jwtService.generateToken(businessOwnerUser);

        // 3. Admin User
        adminUser = userRepository.save(User.builder()
                .email("admin@accessmap.local")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .fullName("System Administrator")
                .role(UserRole.ROLE_ADMIN)
                .isEnabled(true)
                .build());
        adminToken = jwtService.generateToken(adminUser);

        // 4. Test Place
        Point pt = geometryFactory.createPoint(new Coordinate(72.8777, 19.0760));
        sampleHospital = placeRepository.save(Place.builder()
                .name("St. Jude Community Hospital")
                .category("HOSPITAL")
                .address("10 Hospital Lane")
                .city("Metro City")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .geom(pt)
                .isActive(true)
                .build());
    }

    // =========================================================================
    // 1. FEATURE CATALOGUE RETRIEVAL
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/accessibility/features — returns 21 standardized features grouped across categories")
    void getFeatureCatalog_success() throws Exception {
        mockMvc.perform(get("/api/v1/accessibility/features"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(21))
                .andExpect(jsonPath("$.data[0].code").value("WHEELCHAIR_ACCESSIBLE_ENTRANCE"))
                .andExpect(jsonPath("$.data[0].category").value("ENTRANCE"));
    }

    // =========================================================================
    // 2 & 3. ACCESSIBILITY PROFILE RETRIEVAL & MISSING INFORMATION IS UNKNOWN
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/places/{id}/accessibility — un-audited venue returns all features strictly as UNKNOWN")
    void getPlaceAccessibility_allUnknownByDefault() throws Exception {
        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId() + "/accessibility"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.placeId").value(sampleHospital.getId().toString()))
                .andExpect(jsonPath("$.data.availableCount").value(0))
                .andExpect(jsonPath("$.data.notAvailableCount").value(0))
                .andExpect(jsonPath("$.data.unknownCount").value(21))
                .andExpect(jsonPath("$.data.notVerifiedCount").value(0))
                .andExpect(jsonPath("$.data.totalTrackedFeatures").value(21))
                .andExpect(jsonPath("$.data.features[0].status").value("UNKNOWN"));
    }

    // =========================================================================
    // 4. OBSERVATION SUBMISSION BY REGULAR USER
    // =========================================================================

    @Test
    @DisplayName("POST /api/v1/places/{id}/observations — ROLE_USER submits observation checklist")
    void submitObservation_userRole_success() throws Exception {
        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(
                        new ObservationItemSubmitRequest("WHEELCHAIR_ACCESSIBLE_ENTRANCE", FeatureStatus.AVAILABLE, "Ramped front entrance."),
                        new ObservationItemSubmitRequest("ELEVATOR_AVAILABILITY", FeatureStatus.AVAILABLE, "Two passenger elevators operational.")
                ),
                "Visited the hospital today. Main lobby is fully accessible.",
                OffsetDateTime.now(),
                List.of(
                        new ObservationEvidenceSubmitRequest("https://images.accessmap.local/hospital-ramp.jpg", "Main entrance ramp", "WHEELCHAIR_ACCESSIBLE_ENTRANCE")
                )
        );

        mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.submissionType").value("COMMUNITY"))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.evidence.length()").value(1));

        // CRITICAL CHECK: Official profile must NOT be modified before admin approval
        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId() + "/accessibility"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableCount").value(0))
                .andExpect(jsonPath("$.data.unknownCount").value(21))
                .andExpect(jsonPath("$.data.pendingObservationsCount").value(1));
    }

    // =========================================================================
    // 5. ROLE-BASED SUBMISSION RESTRICTIONS (UNAUTHENTICATED)
    // =========================================================================

    @Test
    @DisplayName("POST /api/v1/places/{id}/observations — unauthenticated returns 401 UNAUTHORIZED")
    void submitObservation_unauthenticated() throws Exception {
        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(new ObservationItemSubmitRequest("ENTRANCE_RAMP", FeatureStatus.AVAILABLE, "Ramp present")),
                "Description", OffsetDateTime.now(), null
        );

        mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 6. BUSINESS OWNERSHIP CHECKS
    // =========================================================================

    @Test
    @DisplayName("POST /api/v1/places/{id}/observations — ROLE_BUSINESS_OWNER without verified ownership returns 403")
    void submitObservation_businessOwner_unverifiedOwnership_forbidden() throws Exception {
        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(new ObservationItemSubmitRequest("ENTRANCE_RAMP", FeatureStatus.AVAILABLE, "Ramp present")),
                "Owner update", OffsetDateTime.now(), null
        );

        // Business owner has NOT claimed or verified ownership of sampleHospital
        mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .header("Authorization", "Bearer " + businessOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/places/{id}/observations — ROLE_BUSINESS_OWNER with verified ownership succeeds")
    void submitObservation_businessOwner_verifiedOwnership_success() throws Exception {
        // Setup verified ownership
        placeOwnershipRepository.save(PlaceOwnership.builder()
                .place(sampleHospital)
                .user(businessOwnerUser)
                .isVerified(true)
                .verifiedAt(OffsetDateTime.now())
                .build());

        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(new ObservationItemSubmitRequest("AUTOMATIC_DOORS", FeatureStatus.AVAILABLE, "Power sliding doors installed")),
                "Official business update", OffsetDateTime.now(), null
        );

        mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .header("Authorization", "Bearer " + businessOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.submissionType").value("BUSINESS_OWNER"))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"));
    }

    // =========================================================================
    // 7, 8 & 10. ADMIN APPROVAL & VERIFIED PROFILE UPDATE
    // =========================================================================

    @Test
    @DisplayName("Admin approval updates official AccessibilityFeature records and four-state counts")
    void adminReview_approval_updatesOfficialProfile() throws Exception {
        // 1. Submit observation
        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(
                        new ObservationItemSubmitRequest("WHEELCHAIR_ACCESSIBLE_ENTRANCE", FeatureStatus.AVAILABLE, "Level front access"),
                        new ObservationItemSubmitRequest("HANDRAILS", FeatureStatus.NOT_AVAILABLE, "No handrails installed on steps")
                ),
                "Community audit report", OffsetDateTime.now(), null
        );

        String createJson = mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String submissionId = objectMapper.readTree(createJson).get("data").get("id").asText();

        // 2. Admin approves observation
        ObservationReviewRequest reviewReq = new ObservationReviewRequest(
                ObservationVerificationStatus.APPROVED,
                "Verified against photo evidence and hospital facility map."
        );

        mockMvc.perform(post("/api/v1/admin/observations/" + submissionId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.reviewedByName").value("System Administrator"));

        // 3. Verify that official profile is now updated!
        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId() + "/accessibility"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableCount").value(1))
                .andExpect(jsonPath("$.data.notAvailableCount").value(1))
                .andExpect(jsonPath("$.data.unknownCount").value(19))
                .andExpect(jsonPath("$.data.lastVerifiedAt").isNotEmpty());
    }

    // =========================================================================
    // 9 & 11. ADMIN REJECTION & AUDIT HISTORY PRESERVED
    // =========================================================================

    @Test
    @DisplayName("Admin rejection preserves audit history without modifying official profile")
    void adminReview_rejection_preservesAuditWithoutProfileChange() throws Exception {
        // 1. Submit observation
        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(new ObservationItemSubmitRequest("BRAILLE_SIGNAGE", FeatureStatus.AVAILABLE, "Braille signs")),
                "Doubtful report", OffsetDateTime.now(), null
        );

        String createJson = mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String submissionId = objectMapper.readTree(createJson).get("data").get("id").asText();

        // 2. Admin rejects observation
        ObservationReviewRequest reviewReq = new ObservationReviewRequest(
                ObservationVerificationStatus.REJECTED,
                "Photo evidence does not show standard Braille signage."
        );

        mockMvc.perform(post("/api/v1/admin/observations/" + submissionId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.reviewNotes").value("Photo evidence does not show standard Braille signage."));

        // 3. Official profile remains UNKNOWN
        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId() + "/accessibility"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableCount").value(0))
                .andExpect(jsonPath("$.data.unknownCount").value(21));

        // 4. Observation audit history still exists
        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId() + "/observations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].verificationStatus").value("REJECTED"));
    }

    // =========================================================================
    // 12. UNAUTHORIZED MODIFICATIONS (NON-ADMIN REVIEW ATTEMPT)
    // =========================================================================

    @Test
    @DisplayName("POST /api/v1/admin/observations/{id}/review — ROLE_USER returns 403 FORBIDDEN")
    void reviewObservation_userRole_forbidden() throws Exception {
        ObservationReviewRequest reviewReq = new ObservationReviewRequest(
                ObservationVerificationStatus.APPROVED,
                "Unauthorized review"
        );

        mockMvc.perform(post("/api/v1/admin/observations/" + UUID.randomUUID() + "/review")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 13. IMAGE VALIDATION
    // =========================================================================

    @Test
    @DisplayName("Observation submission rejects invalid image URL scheme with 400 VALIDATION_ERROR")
    void submitObservation_invalidImageUrl_badRequest() throws Exception {
        ObservationSubmitRequest req = new ObservationSubmitRequest(
                List.of(new ObservationItemSubmitRequest("ENTRANCE_RAMP", FeatureStatus.AVAILABLE, "Ramp")),
                "Test description",
                OffsetDateTime.now(),
                List.of(new ObservationEvidenceSubmitRequest("javascript:alert(1)", "Malicious URL", "ENTRANCE_RAMP"))
        );

        mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/observations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    // =========================================================================
    // 14 & 15. ACCESSIBILITY FILTERS ON /api/v1/places
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/places?features=WHEELCHAIR_ACCESSIBLE_ENTRANCE — filters venues with verified feature")
    void getPlaces_filterByAccessibilityFeature() throws Exception {
        // Place 1 (sampleHospital): has WHEELCHAIR_ACCESSIBLE_ENTRANCE = AVAILABLE
        accessibilityFeatureRepository.save(AccessibilityFeature.builder()
                .place(sampleHospital)
                .featureType(FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now())
                .build());

        // Place 2: Library with NO features
        Point libPt = geometryFactory.createPoint(new Coordinate(72.8720, 19.0735));
        placeRepository.save(Place.builder()
                .name("Central Public Library")
                .category("LIBRARY")
                .address("20 Book Street")
                .city("Metro City")
                .country("India")
                .geom(libPt)
                .isActive(true)
                .build());

        // Filtering by WHEELCHAIR_ACCESSIBLE_ENTRANCE returns only sampleHospital
        mockMvc.perform(get("/api/v1/places").param("features", "WHEELCHAIR_ACCESSIBLE_ENTRANCE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("St. Jude Community Hospital"));
    }

    // =========================================================================
    // 16. PHASE 8: GET /api/v1/accessibility-features (CATALOGUE ALIAS)
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/accessibility-features returns full catalogue")
    void getFeatureCatalog_aliasEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/accessibility-features"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(21));
    }

    // =========================================================================
    // 17. PHASE 8: GET /api/v1/places/{id}/accessibility/summary
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/places/{id}/accessibility/summary returns four-state metrics and score")
    void getPlaceAccessibilitySummary_success() throws Exception {
        // Place has WHEELCHAIR_ACCESSIBLE_ENTRANCE = AVAILABLE
        accessibilityFeatureRepository.save(AccessibilityFeature.builder()
                .place(sampleHospital)
                .featureType(FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId() + "/accessibility/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.placeId").value(sampleHospital.getId().toString()))
                .andExpect(jsonPath("$.data.availableCount").value(1))
                .andExpect(jsonPath("$.data.unknownCount").value(20))
                .andExpect(jsonPath("$.data.totalFeatures").value(21));
    }

    // =========================================================================
    // 18. PHASE 8: OBSERVATIONS WORKFLOW (SUBMIT, ME, APPROVE, AUDIT LOG)
    // =========================================================================

    @Test
    @DisplayName("Phase 8 Observation workflow: submit, view in /me, approve with audit log")
    void observationWorkflow_endToEndWithAuditLog() throws Exception {
        // 1. Submit observation via /api/v1/places/{id}/accessibility/observations
        ObservationSubmitRequest submitReq = new ObservationSubmitRequest(
                List.of(
                        new ObservationItemSubmitRequest("ENTRANCE_RAMP", FeatureStatus.AVAILABLE, "Ramp verified"),
                        new ObservationItemSubmitRequest("AUTOMATIC_DOORS", FeatureStatus.NOT_AVAILABLE, "Manual doors only")
                ),
                "Field observation report",
                OffsetDateTime.now(),
                null
        );

        String responseJson = mockMvc.perform(post("/api/v1/places/" + sampleHospital.getId() + "/accessibility/observations")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        String submissionId = objectMapper.readTree(responseJson).path("data").path("id").asText();

        // 2. GET /api/v1/accessibility/observations/me returns this submission
        mockMvc.perform(get("/api/v1/accessibility/observations/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(submissionId));

        // 3. Admin approves via POST /api/v1/admin/accessibility/observations/{id}/approve
        mockMvc.perform(post("/api/v1/admin/accessibility/observations/" + submissionId + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("notes", "Verified by on-site inspection team"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.verificationStatus").value("APPROVED"));

        // 4. Verify AccessibilityFeature records were updated
        AccessibilityFeature ramp = accessibilityFeatureRepository
                .findByPlaceIdAndFeatureType(sampleHospital.getId(), FeatureType.ENTRANCE_RAMP).orElseThrow();
        assertThat(ramp.getStatus()).isEqualTo(FeatureStatus.AVAILABLE);

        AccessibilityFeature autoDoors = accessibilityFeatureRepository
                .findByPlaceIdAndFeatureType(sampleHospital.getId(), FeatureType.AUTOMATIC_DOORS).orElseThrow();
        assertThat(autoDoors.getStatus()).isEqualTo(FeatureStatus.NOT_AVAILABLE);

        // 5. Verify AccessibilityAuditLog records were created
        List<AccessibilityAuditLog> auditLogs = accessibilityAuditLogRepository.findByPlaceIdOrderByCreatedAtDesc(sampleHospital.getId());
        assertThat(auditLogs).hasSize(2);
        assertThat(auditLogs).anyMatch(log -> log.getFeatureCode().equals("ENTRANCE_RAMP") && log.getNewStatus() == FeatureStatus.AVAILABLE);
        assertThat(auditLogs).anyMatch(log -> log.getFeatureCode().equals("AUTOMATIC_DOORS") && log.getNewStatus() == FeatureStatus.NOT_AVAILABLE);
    }
}

