package com.accessmap.entity;

/**
 * Categories of disputes regarding accessibility information or moderation decisions.
 */
public enum DisputeCategory {
    INCORRECT_ACCESSIBILITY_INFO("Incorrect accessibility information"),
    OUTDATED_FACILITY_INFO("Outdated facility information"),
    INCORRECT_REPORT_APPROVAL("Incorrect report approval"),
    INCORRECT_REPORT_REJECTION("Incorrect report rejection"),
    FEATURE_STATUS_CHANGE("Accessibility feature status change");

    private final String displayName;

    DisputeCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

