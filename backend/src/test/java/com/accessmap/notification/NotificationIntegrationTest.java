package com.accessmap.notification;

import com.accessmap.config.JwtService;
import com.accessmap.dto.DisputeCreateRequest;
import com.accessmap.dto.NotificationPreferenceUpdateRequest;
import com.accessmap.dto.ReportCreateRequest;
import com.accessmap.entity.*;
import com.accessmap.repository.*;
import com.accessmap.service.DisputeService;
import com.accessmap.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NotificationIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PlaceRepository placeRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired NotificationPreferenceRepository preferenceRepository;
    @Autowired NotificationService notificationService;
    @Autowired DisputeService disputeService;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private User adminUser;
    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
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

        userA = userRepository.save(User.builder()
                .email("usera_" + UUID.randomUUID() + "@accessmap.local")
                .fullName("Alice User")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());

        userB = userRepository.save(User.builder()
                .email("userb_" + UUID.randomUUID() + "@accessmap.local")
                .fullName("Bob User")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());

        tokenA = "Bearer " + jwtService.generateToken(userA);
        tokenB = "Bearer " + jwtService.generateToken(userB);

        testPlace = placeRepository.save(Place.builder()
                .name("Civic Center Arena")
                .address("100 Main St")
                .city("Metro")
                .postalCode("12345")
                .country("US")
                .category("ENTERTAINMENT")
                .geom(gf.createPoint(new Coordinate(-122.4194, 37.7749)))
                .build());
    }

    @Test
    @DisplayName("Should fetch notifications with unread count and pagination")
    void testFetchNotificationsAndUnreadCount() throws Exception {
        // Initially 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));

        // Create 2 notifications for User A
        notificationService.sendNotification(userA, NotificationType.REPORT_SUBMITTED,
                "Report 1", "Your report is pending", "REPORT", UUID.randomUUID(), null);
        notificationService.sendNotification(userA, NotificationType.ACCOUNT_SECURITY_ALERT,
                "Security Alert", "New login detected", "USER", userA.getId(), null);

        // Unread count should now be 2
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(2));

        // Fetch notifications list
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.page.totalElements").value(2));
    }

    @Test
    @DisplayName("Should mark single notification as read and prevent IDOR access")
    void testMarkAsRead_WithIdorProtection() throws Exception {
        Notification notifA = notificationService.sendNotification(userA, NotificationType.REPORT_SUBMITTED,
                "Report Received", "Report submitted", "REPORT", UUID.randomUUID(), null);
        assertThat(notifA).isNotNull();

        // User B tries to mark User A's notification as read -> 403 Forbidden
        mockMvc.perform(patch("/api/v1/notifications/" + notifA.getId() + "/read")
                        .header("Authorization", tokenB))
                .andExpect(status().isForbidden());

        // User A marks own notification as read -> 200 OK
        mockMvc.perform(patch("/api/v1/notifications/" + notifA.getId() + "/read")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead").value(true))
                .andExpect(jsonPath("$.data.readAt").isNotEmpty());

        // Unread count for User A should now be 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));
    }

    @Test
    @DisplayName("Should mark all notifications as read for current user")
    void testMarkAllAsRead() throws Exception {
        notificationService.sendNotification(userA, NotificationType.REPORT_SUBMITTED, "Title 1", "Msg 1", "REPORT", null, null);
        notificationService.sendNotification(userA, NotificationType.DISPUTE_UPDATED, "Title 2", "Msg 2", "DISPUTE", null, null);
        notificationService.sendNotification(userB, NotificationType.REPORT_SUBMITTED, "Title 3", "Msg 3", "REPORT", null, null);

        // User A marks all as read
        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // User A unread count = 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));

        // User B unread count remains 1
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(1));
    }

    @Test
    @DisplayName("Should get default notification preferences and update them")
    void testNotificationPreferences() throws Exception {
        // Fetch preferences (should list all NotificationType values with default inAppEnabled=true)
        mockMvc.perform(get("/api/v1/notifications/preferences")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(NotificationType.values().length)))
                .andExpect(jsonPath("$.data[?(@.type == 'REPORT_SUBMITTED')].inAppEnabled").value(true));

        // Update preference: disable inApp for REPORT_SUBMITTED
        NotificationPreferenceUpdateRequest updateReq = new NotificationPreferenceUpdateRequest(
                NotificationType.REPORT_SUBMITTED, false, true);

        mockMvc.perform(put("/api/v1/notifications/preferences")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(updateReq))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.type == 'REPORT_SUBMITTED')].inAppEnabled").value(false))
                .andExpect(jsonPath("$.data[?(@.type == 'REPORT_SUBMITTED')].emailEnabled").value(true));

        // When sending notification with inApp disabled, no notification is saved
        Notification notif = notificationService.sendNotification(
                userA, NotificationType.REPORT_SUBMITTED, "Test Title", "Test Message", "REPORT", null, null);
        assertThat(notif).isNull();

        long count = notificationRepository.countByRecipientIdAndIsReadFalse(userA.getId());
        assertThat(count).isEqualTo(0);
    }

    @Test
    @DisplayName("Should dispatch notifications on dispute creation")
    void testDisputeNotificationDispatch() {
        DisputeCreateRequest req = new DisputeCreateRequest();
        req.setPlaceId(testPlace.getId());
        req.setFeatureCode("wheelchair_accessible");
        req.setCategory(DisputeCategory.INCORRECT_ACCESSIBILITY_INFO);
        req.setExplanation("Ramp has been rebuilt and is now accessible.");

        disputeService.createDispute(req, userA, null);

        // Submitter should have received DISPUTE_UPDATED notification
        List<Notification> userNotifications = notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(
                userA.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();

        assertThat(userNotifications).isNotEmpty();
        assertThat(userNotifications.get(0).getType()).isEqualTo(NotificationType.DISPUTE_UPDATED);

        // Admin should have received NEW_DISPUTE notification
        List<Notification> adminNotifications = notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(
                adminUser.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();

        assertThat(adminNotifications).isNotEmpty();
        assertThat(adminNotifications.stream().anyMatch(n -> n.getType() == NotificationType.NEW_DISPUTE)).isTrue();
    }

    @Test
    @DisplayName("Should establish authenticated SSE stream connection")
    void testSseStreamConnection() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/notifications/stream")
                        .header("Authorization", tokenA)
                        .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(request().asyncStarted())
                .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }
}
