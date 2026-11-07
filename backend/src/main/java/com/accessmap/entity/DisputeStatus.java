package com.accessmap.entity;

/**
 * Dispute resolution workflow statuses.
 */
public enum DisputeStatus {
    OPEN,
    UNDER_REVIEW,
    ADDITIONAL_INFORMATION_REQUIRED,
    UPHELD,
    OVERTURNED,
    CLOSED;

    public boolean canTransitionTo(DisputeStatus target) {
        if (this == target) {
            return true;
        }
        return switch (this) {
            case OPEN -> target == UNDER_REVIEW || target == CLOSED;
            case UNDER_REVIEW -> target == ADDITIONAL_INFORMATION_REQUIRED || target == UPHELD || target == OVERTURNED || target == CLOSED;
            case ADDITIONAL_INFORMATION_REQUIRED -> target == UNDER_REVIEW || target == CLOSED;
            case UPHELD, OVERTURNED -> target == CLOSED;
            case CLOSED -> target == UNDER_REVIEW; // Reopened
        };
    }
}

