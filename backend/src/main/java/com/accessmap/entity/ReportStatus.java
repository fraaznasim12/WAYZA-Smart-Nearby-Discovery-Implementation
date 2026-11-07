package com.accessmap.entity;

/**
 * Moderation and resolution workflow statuses for community accessibility
 * reports.
 *
 * <ul>
 * <li><b>PENDING</b>: Initial state upon submission by a community member.</li>
 * <li><b>IN_REVIEW</b>: Under active moderation review by an
 * administrator.</li>
 * <li><b>NEEDS_MORE_INFORMATION</b>: Moderator requested clearer photos or
 * measurements.</li>
 * <li><b>APPROVED</b>: Verified as a valid accessibility barrier or
 * condition.</li>
 * <li><b>REJECTED</b>: Marked invalid, abusive, duplicate, or unverified.
 * History is preserved.</li>
 * <li><b>DISPUTED</b>: A community member or venue owner has formally
 * challenged the decision.</li>
 * <li><b>RESOLVED</b>: The reported issue has been verified as
 * fixed/remediated.</li>
 * </ul>
 */
public enum ReportStatus {
    PENDING,
    IN_REVIEW,
    NEEDS_MORE_INFORMATION,
    APPROVED,
    REJECTED,
    DISPUTED,
    RESOLVED;

    /**
     * Determines whether transitioning from current state to the target state is
     * permissible.
     */
    public boolean canTransitionTo(ReportStatus target) {
        if (this == target) {
            return true;
        }
        return switch (this) {
            case PENDING ->
                target == IN_REVIEW || target == APPROVED || target == REJECTED || target == NEEDS_MORE_INFORMATION;
            case IN_REVIEW ->
                target == APPROVED || target == REJECTED || target == NEEDS_MORE_INFORMATION || target == DISPUTED;
            case NEEDS_MORE_INFORMATION -> target == IN_REVIEW || target == REJECTED || target == APPROVED;
            case APPROVED -> target == RESOLVED || target == REJECTED || target == DISPUTED;
            case REJECTED -> target == IN_REVIEW || target == DISPUTED;
            case DISPUTED -> target == IN_REVIEW || target == APPROVED || target == REJECTED || target == RESOLVED;
            case RESOLVED -> target == DISPUTED || target == IN_REVIEW;
        };
    }
}
