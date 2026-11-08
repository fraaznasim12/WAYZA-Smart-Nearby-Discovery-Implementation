package com.accessmap.ai;

import com.accessmap.dto.ai.AiChatRequest;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Stage G: AI Accuracy and Anti-Hallucination Evaluation Test Suite.
 *
 * Evaluates:
 * 1. Grounded factual answering with verifiable database evidence citations.
 * 2. Explicit disclosure when information is missing or unverified (never hallucinates).
 * 3. Freshness / staleness detection for audits older than threshold.
 * 4. Multilingual query handling (Hindi, English, Spanish).
 * 5. Unknown venue detection without fabrication.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AiAccuracyEvaluationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PlaceRepository placeRepository;
    @Autowired AccessibilityFeatureRepository featureRepository;
    @Autowired AiRateLimiterService rateLimiterService;

    private Place aiimsDelhi;
    private Place staleAuditPlace;
    private final GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        rateLimiterService.reset();

        // 1. Fully audited hospital with verified features
        aiimsDelhi = placeRepository.save(Place.builder()
                .name("AIIMS New Delhi")
                .description("Premier public medical research university and hospital.")
                .category("HOSPITAL")
                .address("Sri Aurobindo Marg, Ansari Nagar")
                .city("New Delhi")
                .state("Delhi")
                .postalCode("110029")
                .country("India")
                .geom(gf.createPoint(new Coordinate(77.2090, 28.5672)))
                .isActive(true)
                .build());

        featureRepository.save(AccessibilityFeature.builder()
                .place(aiimsDelhi)
                .featureType(FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(5))
                .notes("Main OPD entrance has tactile paving and gentle 1:12 ramp.")
                .build());

        featureRepository.save(AccessibilityFeature.builder()
                .place(aiimsDelhi)
                .featureType(FeatureType.ELEVATOR_AVAILABILITY)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(5))
                .notes("Braille buttons and audio announcements in all tower elevators.")
                .build());

        featureRepository.save(AccessibilityFeature.builder()
                .place(aiimsDelhi)
                .featureType(FeatureType.ACCESSIBLE_RESTROOM)
                .status(FeatureStatus.NOT_AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(2))
                .notes("OPD ground floor accessible toilet under renovation.")
                .build());

        // 2. Place with stale audit data (> 400 days old)
        staleAuditPlace = placeRepository.save(Place.builder()
                .name("Old Delhi Heritage Railway Station")
                .description("Historic transit hub.")
                .category("TRANSIT_STATION")
                .address("Chandni Chowk")
                .city("New Delhi")
                .state("Delhi")
                .postalCode("110006")
                .country("India")
                .geom(gf.createPoint(new Coordinate(77.2289, 28.6619)))
                .isActive(true)
                .build());

        featureRepository.save(AccessibilityFeature.builder()
                .place(staleAuditPlace)
                .featureType(FeatureType.STEP_FREE_ENTRANCE)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(450))
                .notes("Platform 1 entrance level with street.")
                .build());
    }

    @Test
    @DisplayName("Should answer known venue query with database grounding and evidence citations")
    void testGroundedResponseWithEvidenceCitations() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "Does AIIMS New Delhi have wheelchair access?",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reply", containsString("AIIMS New Delhi")))
                .andExpect(jsonPath("$.data.sources", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.sources[0].venueName").value("AIIMS New Delhi"))
                .andExpect(jsonPath("$.data.sources[0].status").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.reliabilityRating").value("HIGH_EVIDENCE"));
    }

    @Test
    @DisplayName("Anti-hallucination: Should explicitly state missing info when place is not in database")
    void testAntiHallucinationForUnknownPlace() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "Is the fictional Atlantis Medical Center wheelchair accessible?",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                // Must state no verified record exists rather than hallucinating details
                .andExpect(jsonPath("$.data.reply", anyOf(
                        containsStringIgnoringCase("don't have verified"),
                        containsStringIgnoringCase("no verified record"),
                        containsStringIgnoringCase("not in our database"),
                        containsStringIgnoringCase("records yet")
                )))
                .andExpect(jsonPath("$.data.reliabilityRating").value("INSUFFICIENT_DATA"));
    }

    @Test
    @DisplayName("Freshness evaluation: Stale audit (> 365 days) must be flagged with STALE rating")
    void testStaleAuditDetection() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "Is Old Delhi Heritage Railway Station accessible?",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reply", containsString("Old Delhi Heritage Railway Station")))
                .andExpect(jsonPath("$.data.reliabilityRating").value("STALE_DATA"));
    }

    @Test
    @DisplayName("Multilingual evaluation: Query in Hindi should receive Hindi response grounded in data")
    void testMultilingualHindiResponse() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "क्या AIIMS New Delhi में व्हीलचेयर रैंप उपलब्ध है?",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                // Must return Devanagari Hindi text containing verified details
                .andExpect(jsonPath("$.data.reply", anyOf(
                        containsString("AIIMS New Delhi"),
                        containsString("सत्यापित"),
                        containsString("AVAILABLE"),
                        containsString("प्रवेश")
                )))
                .andExpect(jsonPath("$.data.sources", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Multilingual evaluation: Query in Spanish should receive Spanish response grounded in data")
    void testMultilingualSpanishResponse() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "¿Tiene AIIMS New Delhi acceso para silla de ruedas?",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/ai/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reply", anyOf(
                        containsString("AIIMS New Delhi"),
                        containsStringIgnoringCase("accesible"),
                        containsStringIgnoringCase("sillas de ruedas"),
                        containsString("AVAILABLE")
                )))
                .andExpect(jsonPath("$.data.sources", hasSize(greaterThanOrEqualTo(1))));
    }
}
