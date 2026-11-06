package com.accessmap.entity;

/**
 * Four-State Accessibility Verification Model.
 *
 * <p>This enum is the central domain type for AccessMap. Physical accessibility
 * features must NEVER be represented as a simple boolean.
 *
 * <p><strong>CRITICAL DOMAIN RULE:</strong> {@code UNKNOWN} must NEVER be treated
 * as {@code NOT_AVAILABLE}. An unknown status means no audit data has been
 * recorded yet — it does not imply the feature is absent.
 *
 * <p>State Transitions (see ARCHITECTURE.md § 2):
 * <pre>
 *   [new place]  -->  UNKNOWN
 *   UNKNOWN      -->  AVAILABLE     (field audit confirms feature)
 *   UNKNOWN      -->  NOT_AVAILABLE (field audit confirms absence)
 *   AVAILABLE    -->  NOT_VERIFIED  (audit age > 180 days)
 *   NOT_AVAILABLE --> NOT_VERIFIED  (audit age > 180 days)
 *   NOT_VERIFIED  --> AVAILABLE     (re-verification confirms feature)
 *   NOT_VERIFIED  --> NOT_AVAILABLE (re-verification confirms absence)
 * </pre>
 */
public enum FeatureStatus {

    /**
     * Confirmed present, operational, and unobstructed on-site within the last 180 days.
     */
    AVAILABLE,

    /**
     * Confirmed absent or non-functional (e.g., stairs only, locked elevator, no ramp).
     */
    NOT_AVAILABLE,

    /**
     * No audit data has been recorded yet.
     * <strong>This state must NEVER be treated as NOT_AVAILABLE.</strong>
     */
    UNKNOWN,

    /**
     * A report exists but has exceeded the 180-day freshness SLA, or is awaiting
     * community peer-review verification. Previously known as UNVERIFIED_STALE.
     */
    NOT_VERIFIED
}

