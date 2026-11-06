package com.accessmap.entity;

/**
 * Enumeration of all audited physical accessibility feature types.
 *
 * <p>Each place may have one {@link AccessibilityFeature} record per feature type,
 * enforced by a database UNIQUE constraint on (place_id, feature_type).
 */
public enum FeatureType {
    STEP_FREE_ENTRANCE,
    RAMP,
    ELEVATOR,
    ACCESSIBLE_RESTROOM,
    ACCESSIBLE_PARKING,
    PUBLIC_TRANSPORT_ACCESSIBILITY
}

