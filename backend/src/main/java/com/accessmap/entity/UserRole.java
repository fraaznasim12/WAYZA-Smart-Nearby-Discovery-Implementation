package com.accessmap.entity;

/**
 * User role definitions for Role-Based Access Control (RBAC).
 *
 * <p>These roles gate access to Spring Security-protected endpoints
 * via {@code @PreAuthorize("hasRole('ADMIN')")} and similar annotations.
 */
public enum UserRole {

    /** Standard consumer: search places, view details, bookmark favorites. */
    ROLE_USER,

    /** Submit accessibility audits, upload photo evidence, submit disputes. */
    ROLE_CONTRIBUTOR,

    /** Manage and verify claimed facilities, respond to community audits. */
    ROLE_BUSINESS,

    /** Business facility owner / manager role. */
    ROLE_BUSINESS_OWNER,

    /** Global moderation, dispute resolution, user management, audit logs. */
    ROLE_ADMIN
}

