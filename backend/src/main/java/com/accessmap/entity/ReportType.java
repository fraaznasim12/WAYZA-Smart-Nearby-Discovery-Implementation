package com.accessmap.entity;

/**
 * High-level classification of community-submitted reports.
 */
public enum ReportType {
    ACCESSIBILITY_ISSUE("Accessibility Issue or Barrier"),
    ACCESSIBILITY_IMPROVEMENT("Accessibility Facility or Improvement"),
    VISIT_REVIEW("General Visit Experience and Review");

    private final String displayName;

    ReportType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
