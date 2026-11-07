package com.accessmap.entity;

/**
 * Standard categories for community accessibility barrier and issue reports.
 * Extensible for future categories across Indian public infrastructure.
 */
public enum ReportCategory {
    INACCESSIBLE_ENTRANCE("Inaccessible entrance"),
    DAMAGED_OR_MISSING_RAMP("Damaged or missing ramp"),
    ELEVATOR_UNAVAILABLE("Elevator unavailable"),
    INACCESSIBLE_WASHROOM("Inaccessible washroom"),
    BLOCKED_PATHWAY("Blocked accessible pathway"),
    INACCESSIBLE_PARKING("Inaccessible parking"),
    MISSING_SIGNAGE("Missing accessibility signage"),
    OTHER("Other accessibility issue");

    private final String displayName;

    ReportCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

