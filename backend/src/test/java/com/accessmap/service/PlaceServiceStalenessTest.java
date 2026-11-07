package com.accessmap.service;

import com.accessmap.entity.AccessibilityFeature;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import com.accessmap.repository.PlaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit tests verifying the Four-State Verification Staleness Engine.
 */
@ExtendWith(MockitoExtension.class)
class PlaceServiceStalenessTest {

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private org.springframework.core.env.Environment environment;

    @InjectMocks
    private PlaceService placeService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(placeService, "stalenessThresholdDays", 180);
    }

    @Test
    @DisplayName("Rule 8: UNKNOWN status is ALWAYS preserved as UNKNOWN, never converted to NOT_AVAILABLE")
    void testUnknownStatusPreserved() {
        AccessibilityFeature feature = AccessibilityFeature.builder()
                .featureType(FeatureType.STEP_FREE_ENTRANCE)
                .status(FeatureStatus.UNKNOWN)
                .lastVerifiedAt(null)
                .build();

        FeatureStatus effective = placeService.computeEffectiveStatus(feature);
        assertEquals(FeatureStatus.UNKNOWN, effective, "UNKNOWN status must never change to NOT_AVAILABLE");
    }

    @Test
    @DisplayName("Staleness Rule: AVAILABLE status within 180 days remains AVAILABLE")
    void testFreshAvailableStatus() {
        AccessibilityFeature feature = AccessibilityFeature.builder()
                .featureType(FeatureType.RAMP)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(30))
                .build();

        FeatureStatus effective = placeService.computeEffectiveStatus(feature);
        assertEquals(FeatureStatus.AVAILABLE, effective, "Fresh audits (< 180 days) should stay AVAILABLE");
    }

    @Test
    @DisplayName("Staleness Rule: AVAILABLE status older than 180 days becomes NOT_VERIFIED")
    void testStaleAvailableStatusBecomesNotVerified() {
        AccessibilityFeature feature = AccessibilityFeature.builder()
                .featureType(FeatureType.ELEVATOR)
                .status(FeatureStatus.AVAILABLE)
                .lastVerifiedAt(OffsetDateTime.now().minusDays(181))
                .build();

        FeatureStatus effective = placeService.computeEffectiveStatus(feature);
        assertEquals(FeatureStatus.NOT_VERIFIED, effective, "Audits older than 180 days must transition to NOT_VERIFIED");
    }
}

