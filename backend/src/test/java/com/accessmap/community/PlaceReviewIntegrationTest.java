package com.accessmap.community;

import com.accessmap.dto.CreatePlaceReviewRequest;
import com.accessmap.dto.ReviewModerationRequest;
import com.accessmap.entity.Place;
import com.accessmap.entity.PlaceReview;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.repository.PlaceRepository;
import com.accessmap.repository.PlaceReviewRepository;
import com.accessmap.repository.UserRepository;
import com.accessmap.config.JwtService;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PlaceReviewIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PlaceRepository placeRepository;
    @Autowired PlaceReviewRepository reviewRepository;
    @Autowired UserRepository userRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private Place place;
    private User testUser;
    private User adminUser;
    private String userToken;
    private String adminToken;
    private final GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        place = placeRepository.save(Place.builder()
                .name("Community Test Centre")
                .description("Public testing venue.")
                .category("COMMUNITY_CENTRE")
                .address("100 MG Road")
                .city("Bengaluru")
                .state("Karnataka")
                .country("India")
                .geom(gf.createPoint(new Coordinate(77.5946, 12.9716)))
                .isActive(true)
                .build());

        testUser = userRepository.save(User.builder()
                .email("reviewer" + UUID.randomUUID() + "@accessmap.local")
                .passwordHash(passwordEncoder.encode("TestPass123!"))
                .fullName("Aarav Sharma")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());

        adminUser = userRepository.save(User.builder()
                .email("admin" + UUID.randomUUID() + "@accessmap.local")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .fullName("Admin Moderator")
                .role(UserRole.ROLE_ADMIN)
                .isEnabled(true)
                .build());

        userToken = jwtService.generateToken(testUser);
        adminToken = jwtService.generateToken(adminUser);
    }

    @Test
    @DisplayName("Should submit community review and set status to PENDING")
    void testSubmitReview() throws Exception {
        CreatePlaceReviewRequest request = new CreatePlaceReviewRequest();
        request.setRating(5);
        request.setVisitDate(LocalDate.now().minusDays(1));
        request.setReviewText("Excellent accessibility ramp and wide automatic doors.");
        request.setAccessibilitySummary("Clean tactile paving all the way from the curb.");
        request.setHadAccessibleEntrance(true);
        request.setHadElevator(true);
        request.setHadAccessibleRestroom(true);

        mockMvc.perform(post("/api/v1/places/" + place.getId() + "/reviews")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.reviewerName").value("Aarav S."))
                .andExpect(jsonPath("$.data.hadAccessibleEntrance").value(true));

        assertThat(reviewRepository.existsByPlaceIdAndUserId(place.getId(), testUser.getId())).isTrue();
    }

    @Test
    @DisplayName("Should reject duplicate review by same user for same place")
    void testPreventDuplicateReview() throws Exception {
        // Create first review
        reviewRepository.save(PlaceReview.builder()
                .place(place)
                .user(testUser)
                .rating(4)
                .status(PlaceReview.ReviewStatus.PENDING)
                .build());

        CreatePlaceReviewRequest duplicateRequest = new CreatePlaceReviewRequest();
        duplicateRequest.setRating(3);

        mockMvc.perform(post("/api/v1/places/" + place.getId() + "/reviews")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Admin can approve pending review and public can see it")
    void testAdminApproveAndPublicView() throws Exception {
        PlaceReview review = reviewRepository.save(PlaceReview.builder()
                .place(place)
                .user(testUser)
                .rating(5)
                .reviewText("Spacious restrooms with grab bars.")
                .hadAccessibleRestroom(true)
                .status(PlaceReview.ReviewStatus.PENDING)
                .build());

        // 1. Initially public GET reviews returns 0 because status is PENDING
        mockMvc.perform(get("/api/v1/places/" + place.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));

        // 2. Admin approves review
        ReviewModerationRequest modRequest = new ReviewModerationRequest();
        modRequest.setAction("APPROVED");

        mockMvc.perform(put("/api/v1/admin/reviews/" + review.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // 3. Public GET now returns 1 approved review
        mockMvc.perform(get("/api/v1/places/" + place.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].rating").value(5))
                .andExpect(jsonPath("$.data.content[0].status").value("APPROVED"));
    }
}
