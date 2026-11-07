package com.accessmap.report;

import com.accessmap.config.JwtService;
import com.accessmap.dto.ReportCreateRequest;
import com.accessmap.dto.ReportStatusUpdateRequest;
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
class AccessibilityReportIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PlaceRepository placeRepository;
    @Autowired AccessibilityReportRepository reportRepository;
    @Autowired ReportPhotoRepository photoRepository;
    @Autowired AccessibilityFeatureRepository accessibilityFeatureRepository;
    @Autowired AccessibilityAuditLogRepository auditLogRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    @MockBean
    MediaStorageService mediaStorageService;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User regularUser;
    private User otherUser;
    private User adminUser;
    private String userToken;
    private String otherUserToken;
    private String adminToken;
    private Place testPlace;

    @BeforeEach
    void setUp() {
        photoRepository.deleteAll();
        reportRepository.deleteAll();
        auditLogRepository.deleteAll();
        accessibilityFeatureRepository.deleteAll();
        placeRepository.deleteAll();
        userRepository.deleteAll();

        regularUser = userRepository.save(User.builder()
                .email("reporter@accessmap.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Jane Reporter")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@accessmap.local")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("John Other")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());

        adminUser = userRepository.save(User.builder()
                .email("admin@accessmap.local")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .fullName("Super Admin")
                .role(UserRole.ROLE_ADMIN)
                .isEnabled(true)
                .build());

        userToken = jwtService.generateToken(regularUser);
        otherUserToken = jwtService.generateToken(otherUser);
        adminToken = jwtService.generateToken(adminUser);

        Point location = geometryFactory.createPoint(new Coordinate(72.8777, 19.0760));
        testPlace = placeRepository.save(Place.builder()
                .name("Civic Hospital Mumbai")
                .category("HOSPITAL")
                .address("12 Mahatma Gandhi Road")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .geom(location)
                .build());

        when(mediaStorageService.uploadReportEvidence(any())).thenReturn(
                new MediaStorageService.UploadResult(
                        "evidence/test-evidence-key.webp",
                        "accessmap-media",
                        "image/webp",
                        12345L,
                        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                )
        );
        when(mediaStorageService.generatePresignedGetUrl(any())).thenReturn("https://minio.accessmap.local/presigned-evidence-url");
    }

    @Test
    @DisplayName("1. Unauthenticated report submission is rejected with 401")
    void unauthenticatedSubmissionFails() throws Exception {
        ReportCreateRequest request = ReportCreateRequest.builder()
                .placeId(testPlace.getId())
                .category(ReportCategory.INACCESSIBLE_ENTRANCE)
                .title("Broken Entrance Steps")
                .description("Entrance steps are broken, wheelchair user cannot enter.")
                .build();

        mockMvc.perform(post("/api/v1/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. Authenticated user can submit a report with JSON payload")
    void authenticatedUserSubmitsReportJson() throws Exception {
        ReportCreateRequest request = ReportCreateRequest.builder()
                .placeId(testPlace.getId())
                .category(ReportCategory.DAMAGED_OR_MISSING_RAMP)
                .issueType("ENTRANCE_RAMP")
                .title("Damaged ramp at south gate")
                .description("Ramp surface has large cracks and no handrail.")
                .observationDate(OffsetDateTime.now())
                .latitude(19.0761)
                .longitude(72.8778)
                .build();

        mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.placeId").value(testPlace.getId().toString()))
                .andExpect(jsonPath("$.data.title").value("Damaged ramp at south gate"))
                .andExpect(jsonPath("$.data.category").value("DAMAGED_OR_MISSING_RAMP"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        List<AccessibilityReport> all = reportRepository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getStatus()).isEqualTo(ReportStatus.PENDING);
        assertThat(all.get(0).getReportingUser().getId()).isEqualTo(regularUser.getId());
    }

    @Test
    @DisplayName("3. Submission with non-existent place ID returns 404")
    void submissionWithInvalidPlaceIdFails() throws Exception {
        ReportCreateRequest request = ReportCreateRequest.builder()
                .placeId(UUID.randomUUID())
                .category(ReportCategory.ELEVATOR_UNAVAILABLE)
                .title("Elevator out of order")
                .description("Elevator has been out of service for three days.")
                .build();

        mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("4. Authenticated user can submit a report with multipart files")
    void authenticatedUserSubmitsReportMultipart() throws Exception {
        ReportCreateRequest request = ReportCreateRequest.builder()
                .placeId(testPlace.getId())
                .category(ReportCategory.ELEVATOR_UNAVAILABLE)
                .issueType("ELEVATOR_AVAILABILITY")
                .title("Lift Out of Service")
                .description("Elevator power is turned off; buttons unresponsive.")
                .build();

        MockMultipartFile reportPart = new MockMultipartFile(
                "report",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        MockMultipartFile file1 = new MockMultipartFile(
                "files",
                "broken_elevator.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3, 4}
        );

        mockMvc.perform(multipart("/api/v1/reports")
                        .file(reportPart)
                        .file(file1)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.photos", hasSize(1)))
                .andExpect(jsonPath("$.data.photos[0].photoUrl").value("https://minio.accessmap.local/presigned-evidence-url"));

        List<AccessibilityReport> all = reportRepository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getPhotos()).hasSize(1);
    }

    @Test
    @DisplayName("5. Exceeding maximum 5 photos throws 400 Bad Request")
    void exceedingMaxPhotosFails() throws Exception {
        ReportCreateRequest request = ReportCreateRequest.builder()
                .placeId(testPlace.getId())
                .category(ReportCategory.INACCESSIBLE_PARKING)
                .title("Parking barrier")
                .description("Bollards prevent wheelchair vans.")
                .build();

        MockMultipartFile reportPart = new MockMultipartFile("report", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(request));
        MockMultipartFile f1 = new MockMultipartFile("files", "1.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile f2 = new MockMultipartFile("files", "2.jpg", "image/jpeg", new byte[]{2});
        MockMultipartFile f3 = new MockMultipartFile("files", "3.jpg", "image/jpeg", new byte[]{3});
        MockMultipartFile f4 = new MockMultipartFile("files", "4.jpg", "image/jpeg", new byte[]{4});
        MockMultipartFile f5 = new MockMultipartFile("files", "5.jpg", "image/jpeg", new byte[]{5});
        MockMultipartFile f6 = new MockMultipartFile("files", "6.jpg", "image/jpeg", new byte[]{6});

        mockMvc.perform(multipart("/api/v1/reports")
                        .file(reportPart)
                        .file(f1).file(f2).file(f3).file(f4).file(f5).file(f6)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message", containsString("maximum of 5")));
    }

    @Test
    @DisplayName("6. User can view their own reports at /api/v1/reports/me")
    void userCanViewOwnReports() throws Exception {
        AccessibilityReport rep1 = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.INACCESSIBLE_WASHROOM)
                .title("Door too narrow")
                .description("Washroom door is 60cm wide, wheelchair cannot fit.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(otherUser)
                .category(ReportCategory.MISSING_SIGNAGE)
                .title("No braille")
                .description("Missing braille sign.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/v1/reports/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(rep1.getId().toString()))
                .andExpect(jsonPath("$.data[0].title").value("Door too narrow"));
    }

    @Test
    @DisplayName("7. Non-owner cannot access another user's private report by ID")
    void userCannotViewOtherUserReport() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.BLOCKED_PATHWAY)
                .title("Boxes blocking pathway")
                .description("Storage boxes blocking the corridor.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/v1/reports/" + rep.getId())
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Admin can view any user's report by ID")
    void adminCanViewAnyReport() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.BLOCKED_PATHWAY)
                .title("Boxes blocking pathway")
                .description("Storage boxes blocking the corridor.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/v1/reports/" + rep.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(rep.getId().toString()))
                .andExpect(jsonPath("$.data.reportingUserEmail").value("reporter@accessmap.local"));
    }

    @Test
    @DisplayName("9. Admin can list all reports with status filtering")
    void adminCanListReportsWithStatusFilter() throws Exception {
        reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.BLOCKED_PATHWAY)
                .title("Pending report 1")
                .description("Pending desc")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.OTHER)
                .title("Approved report 2")
                .description("Approved desc")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.APPROVED)
                .build());

        mockMvc.perform(get("/api/v1/admin/reports?status=PENDING")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title").value("Pending report 1"));
    }

    @Test
    @DisplayName("10. Admin can transition report to IN_REVIEW")
    void adminTransitionsToInReview() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.DAMAGED_OR_MISSING_RAMP)
                .title("Steep ramp")
                .description("Ramp slope is 1:4.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        ReportStatusUpdateRequest update = ReportStatusUpdateRequest.builder()
                .status(ReportStatus.IN_REVIEW)
                .adminNotes("Under field officer verification.")
                .build();

        mockMvc.perform(patch("/api/v1/admin/reports/" + rep.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_REVIEW"))
                .andExpect(jsonPath("$.data.adminNotes").value("Under field officer verification."));

        AccessibilityReport refreshed = reportRepository.findById(rep.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(ReportStatus.IN_REVIEW);
    }

    @Test
    @DisplayName("11. Admin APPROVAL can update place accessibility profile and write audit log")
    void adminApprovesAndUpdatesProfile() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.ELEVATOR_UNAVAILABLE)
                .issueType("ELEVATOR_AVAILABILITY")
                .title("Elevator broken")
                .description("Elevator has been non-functional since Monday.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.IN_REVIEW)
                .build());

        ReportStatusUpdateRequest update = ReportStatusUpdateRequest.builder()
                .status(ReportStatus.APPROVED)
                .adminNotes("Verified through facility manager.")
                .updateAccessibilityFeature(true)
                .featureCode("ELEVATOR_AVAILABILITY")
                .featureStatus(FeatureStatus.NOT_AVAILABLE)
                .build();

        mockMvc.perform(patch("/api/v1/admin/reports/" + rep.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.profileUpdated").value(true));

        AccessibilityReport refreshed = reportRepository.findById(rep.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(ReportStatus.APPROVED);
        assertThat(refreshed.isProfileUpdated()).isTrue();

        // Verify that the place's feature record is updated to NOT_AVAILABLE
        AccessibilityFeature feature = accessibilityFeatureRepository
                .findByPlaceIdAndFeatureType(testPlace.getId(), FeatureType.ELEVATOR_AVAILABILITY)
                .orElseThrow();
        assertThat(feature.getStatus()).isEqualTo(FeatureStatus.NOT_AVAILABLE);

        // Verify that audit log was generated
        List<AccessibilityAuditLog> logs = auditLogRepository.findByPlaceIdOrderByCreatedAtDesc(testPlace.getId());
        assertThat(logs).isNotEmpty();
        assertThat(logs.get(0).getAction()).isEqualTo("COMMUNITY_REPORT_APPROVED");
        assertThat(logs.get(0).getNewStatus()).isEqualTo(FeatureStatus.NOT_AVAILABLE);
    }

    @Test
    @DisplayName("12. Admin REJECT retains report history and does NOT update place profile")
    void adminRejectsReport() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.OTHER)
                .title("Fake barrier")
                .description("False report description.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        ReportStatusUpdateRequest update = ReportStatusUpdateRequest.builder()
                .status(ReportStatus.REJECTED)
                .adminNotes("Cannot reproduce issue; venue has verified working lift.")
                .build();

        mockMvc.perform(patch("/api/v1/admin/reports/" + rep.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.profileUpdated").value(false));

        AccessibilityReport refreshed = reportRepository.findById(rep.getId()).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(ReportStatus.REJECTED);
        assertThat(refreshed.getAdminNotes()).contains("Cannot reproduce");

        // Verify no audit log was created
        List<AccessibilityAuditLog> logs = auditLogRepository.findByPlaceIdOrderByCreatedAtDesc(testPlace.getId());
        assertThat(logs).isEmpty();
    }

    @Test
    @DisplayName("13. Invalid status transition (PENDING directly to RESOLVED) is rejected with 400")
    void invalidStatusTransitionFails() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.INACCESSIBLE_ENTRANCE)
                .title("Door issue")
                .description("Door issue description.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        ReportStatusUpdateRequest update = ReportStatusUpdateRequest.builder()
                .status(ReportStatus.RESOLVED)
                .adminNotes("Attempting direct resolution.")
                .build();

        mockMvc.perform(patch("/api/v1/admin/reports/" + rep.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message", containsString("Invalid report status transition")));
    }

    @Test
    @DisplayName("14. Regular user cannot perform admin status moderation")
    void nonAdminCannotModerateReport() throws Exception {
        AccessibilityReport rep = reportRepository.save(AccessibilityReport.builder()
                .place(testPlace)
                .reportingUser(regularUser)
                .category(ReportCategory.INACCESSIBLE_ENTRANCE)
                .title("Door issue")
                .description("Door issue description.")
                .observationDate(OffsetDateTime.now())
                .status(ReportStatus.PENDING)
                .build());

        ReportStatusUpdateRequest update = ReportStatusUpdateRequest.builder()
                .status(ReportStatus.APPROVED)
                .build();

        mockMvc.perform(patch("/api/v1/admin/reports/" + rep.getId() + "/status")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }
}
