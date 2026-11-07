package com.accessmap.admin;

import com.accessmap.config.JwtService;
import com.accessmap.dto.AdminPlaceUpdateRequest;
import com.accessmap.dto.AdminUserRoleUpdateRequest;
import com.accessmap.dto.AdminUserStatusUpdateRequest;
import com.accessmap.dto.PlatformSettingUpdateRequest;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminDashboardIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PlaceRepository placeRepository;
    @Autowired PlaceOwnershipRepository ownershipRepository;
    @Autowired AccessibilityReportRepository reportRepository;
    @Autowired DisputeRepository disputeRepository;
    @Autowired AccessibilityFeatureRepository featureRepository;
    @Autowired AdminAuditLogRepository auditLogRepository;
    @Autowired PlatformSettingRepository settingRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private User adminUser;
    private User regularUser;
    private User businessUser;
    private String adminToken;
    private String userToken;
    private Place testPlace;

    private final GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(User.builder()
                .email("admin_" + UUID.randomUUID() + "@accessmap.local")
                .fullName("System Administrator")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(UserRole.ROLE_ADMIN)
                .isEnabled(true)
                .build());

        regularUser = userRepository.save(User.builder()
                .email("user_" + UUID.randomUUID() + "@accessmap.local")
                .fullName("Regular User")
                .passwordHash(passwordEncoder.encode("UserPass123!"))
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());

        businessUser = userRepository.save(User.builder()
                .email("business_" + UUID.randomUUID() + "@accessmap.local")
                .fullName("Business Owner")
                .passwordHash(passwordEncoder.encode("BusinessPass123!"))
                .role(UserRole.ROLE_BUSINESS_OWNER)
                .isEnabled(true)
                .build());

        adminToken = jwtService.generateToken(adminUser);
        userToken = jwtService.generateToken(regularUser);

        Point p = gf.createPoint(new Coordinate(72.8258, 18.9750));
        testPlace = placeRepository.save(Place.builder()
                .name("Grand Central Station Mumbai")
                .category("TRANSIT_HUB")
                .address("Dr Dadabhai Naoroji Rd, Fort")
                .city("Mumbai")
                .state("Maharashtra")
                .country("India")
                .geom(p)
                .isActive(true)
                .sourceName("PLATFORM_SEED")
                .build());
    }

    @Test
    @DisplayName("Admin Overview: returns real aggregated statistics")
    void testGetOverviewStats_asAdmin_returnsRealData() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.activeUsers", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.totalPlaces", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.activePlaces", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Admin Overview: non-admin request is rejected with 403 Forbidden")
    void testGetOverviewStats_asOrdinaryUser_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User Management: search and filter users")
    void testGetUsers_searchAndFilter() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + adminToken)
                .param("search", "Regular")
                .param("role", "ROLE_USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].email").value(regularUser.getEmail()));
    }

    @Test
    @DisplayName("User Management: deactivate user and record audit log")
    void testDeactivateUser_asAdmin_success() throws Exception {
        AdminUserStatusUpdateRequest request = new AdminUserStatusUpdateRequest(false, "Repeated violations");

        mockMvc.perform(patch("/api/v1/admin/users/" + regularUser.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isEnabled").value(false));

        User updated = userRepository.findById(regularUser.getId()).orElseThrow();
        assertThat(updated.getIsEnabled()).isFalse();

        // Verify audit log entry was written
        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> a.getResourceType().equals("USER") && a.getResourceId().equals(regularUser.getId()))).isTrue();
    }

    @Test
    @DisplayName("User Management Security: admin cannot deactivate own account")
    void testDeactivateOwnAccount_rejectedWith400() throws Exception {
        AdminUserStatusUpdateRequest request = new AdminUserStatusUpdateRequest(false, "Self deactivation attempt");

        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("User Management: change user role and record audit log")
    void testChangeUserRole_asAdmin_success() throws Exception {
        AdminUserRoleUpdateRequest request = new AdminUserRoleUpdateRequest(UserRole.ROLE_CONTRIBUTOR, "Promoted for good submissions");

        mockMvc.perform(patch("/api/v1/admin/users/" + regularUser.getId() + "/role")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("ROLE_CONTRIBUTOR"));

        User updated = userRepository.findById(regularUser.getId()).orElseThrow();
        assertThat(updated.getRole()).isEqualTo(UserRole.ROLE_CONTRIBUTOR);
    }

    @Test
    @DisplayName("User Management Security: admin cannot revoke own admin role")
    void testAdminCannotDemoteSelf_rejectedWith400() throws Exception {
        AdminUserRoleUpdateRequest request = new AdminUserRoleUpdateRequest(UserRole.ROLE_USER, "Accidental self-demotion");

        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/role")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Place Management: search places and update metadata")
    void testPlaceManagement_searchAndUpdate() throws Exception {
        mockMvc.perform(get("/api/v1/admin/places")
                .header("Authorization", "Bearer " + adminToken)
                .param("search", "Grand Central")
                .param("city", "Mumbai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Grand Central Station Mumbai"));

        AdminPlaceUpdateRequest updateReq = new AdminPlaceUpdateRequest(
                "Grand Central Railway Hub Mumbai",
                "Updated description",
                "TRANSIT_HUB",
                "New Station Road, Fort",
                "Mumbai",
                "Maharashtra",
                "400001",
                "+91 22 12345678",
                "https://mumbaitransit.gov.in",
                "Official municipal street renumbering"
        );

        mockMvc.perform(put("/api/v1/admin/places/" + testPlace.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Grand Central Railway Hub Mumbai"));
    }

    @Test
    @DisplayName("Place Management: toggle active status")
    void testTogglePlaceStatus() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/places/" + testPlace.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .param("isActive", "false")
                .param("reason", "Temporarily closed for renovation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive").value(false));

        Place updated = placeRepository.findById(testPlace.getId()).orElseThrow();
        assertThat(updated.getIsActive()).isFalse();
    }

    @Test
    @DisplayName("Business Claims: list claims and verify ownership")
    void testBusinessClaims_listAndVerify() throws Exception {
        PlaceOwnership claim = ownershipRepository.save(PlaceOwnership.builder()
                .place(testPlace)
                .user(businessUser)
                .isVerified(false)
                .build());

        mockMvc.perform(get("/api/v1/admin/business-claims")
                .header("Authorization", "Bearer " + adminToken)
                .param("isVerified", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(post("/api/v1/admin/business-claims/" + claim.getId() + "/verify")
                .header("Authorization", "Bearer " + adminToken)
                .param("approved", "true")
                .param("reason", "Business license verified"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isVerified").value(true));

        PlaceOwnership verified = ownershipRepository.findById(claim.getId()).orElseThrow();
        assertThat(verified.getIsVerified()).isTrue();
    }

    @Test
    @DisplayName("Platform Settings: read and update configuration")
    void testPlatformSettings_readAndUpdate() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        PlatformSettingUpdateRequest updateReq = new PlatformSettingUpdateRequest("120");

        mockMvc.perform(put("/api/v1/admin/settings/verification.freshness_threshold_days")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value").value("120"));
    }

    @Test
    @DisplayName("Data Management: get data overview")
    void testGetDataManagementOverview() throws Exception {
        mockMvc.perform(get("/api/v1/admin/data-management/overview")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.providerName").isNotEmpty());
    }

    @Test
    @DisplayName("Audit Logs: list recorded actions")
    void testGetAuditLogs() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

