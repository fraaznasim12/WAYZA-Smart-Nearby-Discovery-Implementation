package com.accessmap.entity;

/**
 * Catalogue of event notification types for users, business owners, and administrators.
 */
public enum NotificationType {

    // --- User Notifications ---
    REPORT_SUBMITTED("Report Received", "Your accessibility report has been lodged."),
    REPORT_APPROVED("Report Approved", "Your accessibility report was reviewed and approved."),
    REPORT_REJECTED("Report Decision", "Your accessibility report was reviewed."),
    ADDITIONAL_INFORMATION_REQUESTED("Information Requested", "A moderator requested additional details on your report."),
    DISPUTE_UPDATED("Dispute Update", "An update was posted to your dispute docket."),
    DISPUTE_RESOLVED("Dispute Adjudicated", "A ruling was recorded on your accessibility dispute."),
    ACCESSIBILITY_PROFILE_UPDATED("Facility Updated", "A venue accessibility profile was updated."),
    ACCOUNT_SECURITY_ALERT("Security Alert", "Security or authentication activity on your account."),

    // --- Business Owner Notifications ---
    BUSINESS_CLAIM_APPROVED("Claim Verified", "Your ownership claim on a venue has been approved."),
    BUSINESS_CLAIM_REJECTED("Claim Decision", "Your venue ownership claim was evaluated."),
    NEW_LOCATION_REPORT("Venue Issue Reported", "A community member reported an accessibility barrier at your venue."),
    ACCESSIBILITY_PROPOSAL_REVIEWED("Facility Proposal Evaluated", "Your proposed facility update was reviewed."),
    BUSINESS_OWNERSHIP_UPDATED("Ownership Record Updated", "Changes were made to your managed facility ownership status."),

    // --- Administrator / Moderator Notifications ---
    NEW_ACCESSIBILITY_REPORT("New Report Pending", "A new community accessibility report requires review."),
    NEW_BUSINESS_CLAIM("New Ownership Claim", "A merchant submitted a business ownership claim for approval."),
    NEW_DISPUTE("New Dispute Lodged", "A community member contested an accessibility profile decision."),
    MODERATION_REQUIRED("Moderation Action Required", "An item has reached escalation threshold.");

    private final String defaultTitle;
    private final String defaultSummary;

    NotificationType(String defaultTitle, String defaultSummary) {
        this.defaultTitle = defaultTitle;
        this.defaultSummary = defaultSummary;
    }

    public String getDefaultTitle() {
        return defaultTitle;
    }

    public String getDefaultSummary() {
        return defaultSummary;
    }
}

