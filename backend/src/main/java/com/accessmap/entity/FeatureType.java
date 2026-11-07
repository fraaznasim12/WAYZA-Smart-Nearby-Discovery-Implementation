package com.accessmap.entity;

/**
 * Enumeration of all standardized physical accessibility feature types.
 *
 * <p>Each place may have one {@link AccessibilityFeature} record per feature type,
 * enforced by a database UNIQUE constraint on (place_id, feature_type).
 */
public enum FeatureType {

    // =========================================================================
    // ENTRANCE
    // =========================================================================
    WHEELCHAIR_ACCESSIBLE_ENTRANCE,
    STEP_FREE_ENTRANCE,
    ENTRANCE_RAMP,
    AUTOMATIC_DOORS,
    DOORWAY_ACCESSIBILITY_INFO,

    // =========================================================================
    // VERTICAL ACCESS
    // =========================================================================
    ELEVATOR_AVAILABILITY,
    ELEVATOR_ACCESSIBILITY,
    STAIR_FREE_ACCESS,
    HANDRAILS,

    // =========================================================================
    // RESTROOM
    // =========================================================================
    ACCESSIBLE_WASHROOM,
    WHEELCHAIR_ACCESSIBLE_RESTROOM,
    ACCESSIBLE_RESTROOM_SIGNAGE,

    // =========================================================================
    // PARKING
    // =========================================================================
    ACCESSIBLE_PARKING,
    RESERVED_WHEELCHAIR_PARKING,

    // =========================================================================
    // PATHWAYS
    // =========================================================================
    WHEELCHAIR_ACCESSIBLE_PATHWAYS,
    ACCESSIBLE_RECEPTION_COUNTERS,
    ACCESSIBLE_SEATING,

    // =========================================================================
    // ADDITIONAL
    // =========================================================================
    BRAILLE_SIGNAGE,
    TACTILE_INDICATORS,
    AUDIO_ASSISTANCE,
    STAFF_ASSISTANCE,

    // =========================================================================
    // LEGACY / BACKWARD COMPATIBILITY
    // =========================================================================
    RAMP,
    ELEVATOR,
    ACCESSIBLE_RESTROOM,
    PUBLIC_TRANSPORT_ACCESSIBILITY;

    /**
     * Resolves a string code safely to a FeatureType or null if not found.
     */
    public static FeatureType fromCode(String code) {
        if (code == null || code.isBlank()) return null;
        try {
            return FeatureType.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
