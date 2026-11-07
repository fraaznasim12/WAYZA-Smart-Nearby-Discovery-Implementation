package com.accessmap.place;

import com.accessmap.dto.PlaceCreateRequest;
import com.accessmap.entity.Place;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.repository.PlaceRepository;
import com.accessmap.repository.UserRepository;
import com.accessmap.config.JwtService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PlaceControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PlaceRepository placeRepository;
    @Autowired UserRepository userRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private String userToken;
    private String adminToken;
    private Place sampleHospital;

    @BeforeEach
    void setUp() {
        placeRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create standard USER and generate JWT
        User user = User.builder()
                .email("regular@accessmap.local")
                .passwordHash(passwordEncoder.encode("UserPass123!"))
                .fullName("Regular User")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build();
        user = userRepository.save(user);
        userToken = jwtService.generateToken(user);

        // 2. Create ADMIN user and generate JWT
        User admin = User.builder()
                .email("admin@accessmap.local")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .fullName("System Admin")
                .role(UserRole.ROLE_ADMIN)
                .isEnabled(true)
                .build();
        admin = userRepository.save(admin);
        adminToken = jwtService.generateToken(admin);

        // 3. Seed test places:
        // Mumbai / Metro City: Lat 19.0760, Lng 72.8777
        Point hospPt = geometryFactory.createPoint(new Coordinate(72.8777, 19.0760));
        sampleHospital = placeRepository.save(Place.builder()
                .name("St. Jude Community Hospital")
                .description("Multi-specialty emergency and outpatient clinic.")
                .category("HOSPITAL")
                .address("10 Hospital Lane")
                .city("Metro City")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .geom(hospPt)
                .isActive(true)
                .build());

        // Nearby Library: Lat 19.0735, Lng 72.8720 (~650m away)
        Point libPt = geometryFactory.createPoint(new Coordinate(72.8720, 19.0735));
        placeRepository.save(Place.builder()
                .name("Central Public Library")
                .description("City reading room and digital center.")
                .category("LIBRARY")
                .address("20 Book Street")
                .city("Metro City")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .geom(libPt)
                .isActive(true)
                .build());
    }

    // =========================================================================
    // 1. LIST PLACES & GENERAL SEARCH
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/places — lists active places with pagination")
    void getPlaces_success() throws Exception {
        mockMvc.perform(get("/api/v1/places"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.page.totalElements").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/places?name=Jude — searches places by name keyword")
    void getPlaces_searchByName() throws Exception {
        mockMvc.perform(get("/api/v1/places").param("name", "Jude"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("St. Jude Community Hospital"));
    }

    @Test
    @DisplayName("GET /api/v1/places?category=LIBRARY — filters by category")
    void getPlaces_filterByCategory() throws Exception {
        mockMvc.perform(get("/api/v1/places").param("category", "LIBRARY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].category").value("LIBRARY"));
    }

    @Test
    @DisplayName("GET /api/v1/places?city=Metro City — filters by city")
    void getPlaces_filterByCity() throws Exception {
        mockMvc.perform(get("/api/v1/places").param("city", "Metro City"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2));
    }

    // =========================================================================
    // 2. PLACE DETAILS BY ID
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/places/{id} — returns place detail for existing ID")
    void getPlaceById_success() throws Exception {
        mockMvc.perform(get("/api/v1/places/" + sampleHospital.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(sampleHospital.getId().toString()))
                .andExpect(jsonPath("$.data.name").value("St. Jude Community Hospital"))
                .andExpect(jsonPath("$.data.latitude").value(19.0760))
                .andExpect(jsonPath("$.data.longitude").value(72.8777));
    }

    @Test
    @DisplayName("GET /api/v1/places/{id} — returns 404 NOT_FOUND for unknown ID")
    void getPlaceById_notFound() throws Exception {
        mockMvc.perform(get("/api/v1/places/" + UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    // =========================================================================
    // 3. GEOGRAPHICAL NEARBY SEARCH & DISTANCE
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/places/nearby — returns places within radius and calculates distance in meters")
    void getNearbyPlaces_success() throws Exception {
        // Query near St. Jude Hospital (Lat: 19.0760, Lng: 72.8777) within 2000m radius
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("lat", "19.0760")
                        .param("lng", "72.8777")
                        .param("radiusMeters", "2000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].distanceMeters").isNumber());
    }

    @Test
    @DisplayName("GET /api/v1/places/nearby — rejects invalid latitude with 400 BAD_REQUEST")
    void getNearbyPlaces_invalidLatitude() throws Exception {
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("lat", "95.0")
                        .param("lng", "72.8777")
                        .param("radiusMeters", "2000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("GET /api/v1/places/nearby — rejects invalid longitude with 400 BAD_REQUEST")
    void getNearbyPlaces_invalidLongitude() throws Exception {
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("lat", "19.0760")
                        .param("lng", "195.0")
                        .param("radiusMeters", "2000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("GET /api/v1/places/nearby — filters nearby places by category")
    void getNearbyPlaces_withCategoryFilter() throws Exception {
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("lat", "19.0760")
                        .param("lng", "72.8777")
                        .param("radiusMeters", "2000")
                        .param("category", "HOSPITAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].category").value("HOSPITAL"))
                .andExpect(jsonPath("$.data.content[0].name").value("St. Jude Community Hospital"));
    }

    @Test
    @DisplayName("GET /api/v1/places/nearby — rejects radius under 10 meters with 400 BAD_REQUEST")
    void getNearbyPlaces_radiusTooSmall() throws Exception {
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("lat", "19.0760")
                        .param("lng", "72.8777")
                        .param("radiusMeters", "5"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("GET /api/v1/places/nearby — rejects radius over 50,000 meters with 400 BAD_REQUEST")
    void getNearbyPlaces_excessiveRadius() throws Exception {
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("lat", "19.0760")
                        .param("lng", "72.8777")
                        .param("radiusMeters", "60000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    // =========================================================================
    // 4. PLACE CREATION & ROLE-BASED ACCESS
    // =========================================================================

    @Test
    @DisplayName("POST /api/v1/places — unauthenticated returns 401 UNAUTHORIZED")
    void createPlace_unauthenticatedReturns401() throws Exception {
        PlaceCreateRequest req = new PlaceCreateRequest(
                "Unauthorized Place", "Desc", "CAFE", "123 Street", "City",
                "State", "12345", "India", 19.0, 72.0, "123", "http://example.com"
        );

        mockMvc.perform(post("/api/v1/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/places — ROLE_USER returns 403 FORBIDDEN")
    void createPlace_userRoleReturns403() throws Exception {
        PlaceCreateRequest req = new PlaceCreateRequest(
                "User Created Place", "Desc", "CAFE", "123 Street", "City",
                "State", "12345", "India", 19.0, 72.0, "123", "http://example.com"
        );

        mockMvc.perform(post("/api/v1/places")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/places — ROLE_ADMIN returns 201 CREATED")
    void createPlace_adminRoleReturns201() throws Exception {
        PlaceCreateRequest req = new PlaceCreateRequest(
                "Admin Approved Venue", "A venue approved by administrator.", "RESTAURANT",
                "50 Dining Way", "Metro City", "Maharashtra", "400002", "India",
                19.0800, 72.8800, "9876543210", "https://example.com/venue"
        );

        mockMvc.perform(post("/api/v1/places")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Admin Approved Venue"))
                .andExpect(jsonPath("$.data.category").value("RESTAURANT"));

        assertThat(placeRepository.findAllByIsActiveTrue()).hasSize(3);
    }

    @Test
    @DisplayName("GET /api/v1/places?state=... — filters places by state name")
    void getPlaces_filterByState() throws Exception {
        mockMvc.perform(get("/api/v1/places")
                        .param("state", "Maharashtra"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].state").value("Maharashtra"));
    }

    @Test
    @DisplayName("GET /api/v1/places/viewport — returns places within geographic bounding box")
    void getPlaces_viewportSearch() throws Exception {
        mockMvc.perform(get("/api/v1/places/viewport")
                        .param("south", "19.00")
                        .param("west", "72.80")
                        .param("north", "19.10")
                        .param("east", "72.90"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }
}
