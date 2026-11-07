package com.accessmap.ai;

import com.accessmap.dto.ai.AiChatRequest;
import com.accessmap.dto.ai.AiReportAssistanceRequest;
import com.accessmap.dto.ai.AiSearchRequest;
import com.accessmap.entity.AccessibilityFeature;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import com.accessmap.entity.Place;
import com.accessmap.repository.AccessibilityFeatureRepository;
import com.accessmap.repository.PlaceRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AiAssistantIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PlaceRepository placeRepository;
    @Autowired AccessibilityFeatureRepository featureRepository;
    @Autowired AiRateLimiterService rateLimiterService;
    @Autowired RuleBasedFallbackAiClient fallbackClient;

    private Place hospitalPlace;
    private Place collegePlace;
    private final GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        rateLimiterService.reset();

        hospitalPlace = placeRepository.save(Place.builder()
                .name("Patna Medical College Hospital")
                .description("Tertiary care center with emergency access.")
                .category("HOSPITAL")
                .address("Ashok Rajpath")
                .city("Patna")
                .state("Bihar")
                .postalCode("800004")
                .country("India")
                .geom(gf.createPoint(new Coordinate(85.1578, 25.6207)))
                .isActive(true)
                .build());

        // Add confirmed available feature to hospital
        featureRepository.save(AccessibilityFeature.builder()
                .place(hospitalPlace)
                .featureType(FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now())
                .notes("Wide ramp with handrails installed at main entrance.")
                .build());

        // Add confirmed unavailable feature (elevator)
        featureRepository.save(AccessibilityFeature.builder()
                .place(hospitalPlace)
                .featureType(FeatureType.ELEVATOR_AVAILABILITY)
                .status(FeatureStatus.NOT_AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now())
                .notes("Out of order.")
                .build());

        collegePlace = placeRepository.save(Place.builder()
                .name("St. Xavier's College")
                .description("Undergraduate college campus.")
                .category("COLLEGE")
                .address("West Gandhi Maidan")
                .city("Patna")
                .state("Bihar")
                .postalCode("800001")
                .country("India")
                .geom(gf.createPoint(new Coordinate(85.1412, 25.6154)))
                .isActive(true)
                .build());
    }

    @Test
    @DisplayName("Should execute natural language search and return real database records")
    void testNaturalLanguageSearch() throws Exception {
        AiSearchRequest request = new AiSearchRequest(
                "Find hospitals in Patna with wheelchair-accessible entrances",
                null, null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.extractedFilters.category").value("HOSPITAL"))
                .andExpect(jsonPath("$.data.extractedFilters.city").value("Patna"))
                .andExpect(jsonPath("$.data.places", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.places[0].name").value("Patna Medical College Hospital"));
    }

    @Test
    @DisplayName("Should explain place accessibility profile using four-state model")
    void testExplainPlaceProfile() throws Exception {
        mockMvc.perform(get("/api/v1/ai/assistant/explain-place/" + hospitalPlace.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.placeName").value("Patna Medical College Hospital"))
                .andExpect(jsonPath("$.data.confirmedAvailable", hasItem(containsStringIgnoringCase("wheelchair"))))
                .andExpect(jsonPath("$.data.confirmedUnavailable", hasItem(containsStringIgnoringCase("elevator"))))
                .andExpect(jsonPath("$.data.plainEnglishExplanation").isNotEmpty());
    }

    @Test
    @DisplayName("Should improve draft accessibility report and suggest missing information")
    void testImproveReport() throws Exception {
        AiReportAssistanceRequest request = new AiReportAssistanceRequest(
                "ramp broken steep slope no handrails",
                hospitalPlace.getId(),
                null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/improve-report")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.improvedDescription").isNotEmpty())
                .andExpect(jsonPath("$.data.suggestedFeatureCode").value("ENTRANCE_RAMP"))
                .andExpect(jsonPath("$.data.missingInformationTips", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Should handle conversational questions grounded in place records")
    void testChatWithPlaceContext() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "Is this place wheelchair accessible?",
                null,
                hospitalPlace.getId(),
                null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reply", containsString("AVAILABLE")))
                .andExpect(jsonPath("$.data.placeId").value(hospitalPlace.getId().toString()));
    }

    @Test
    @DisplayName("Should reject input exceeding maximum allowed character limit")
    void testInputLengthValidation() throws Exception {
        String oversizedQuery = "a".repeat(1005);
        AiSearchRequest request = new AiSearchRequest(oversizedQuery, null, null, null);

        mockMvc.perform(post("/api/v1/ai/assistant/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should enforce rate limiting per user/IP window")
    void testRateLimiterEnforcement() throws Exception {
        AiSearchRequest request = new AiSearchRequest("Find places in Patna", null, null, null);

        // Send 20 requests (within limit)
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(post("/api/v1/ai/assistant/search")
                            .header("X-Forwarded-For", "192.168.1.100")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        // 21st request should be rejected with 429 Too Many Requests
        mockMvc.perform(post("/api/v1/ai/assistant/search")
                        .header("X-Forwarded-For", "192.168.1.100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("Should handle missing venue gracefully when explaining profile")
    void testExplainMissingPlace() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/ai/assistant/explain-place/" + nonExistentId))
                .andExpect(status().isNotFound());
    }
}
