package com.accessmap.dto;

import java.util.List;
import java.util.Map;

public record AdminOverviewStatsDto(
    long totalUsers,
    long activeUsers,
    long totalPlaces,
    long activePlaces,
    Map<String, Long> placesByCategory,
    long totalReports,
    long pendingReports,
    long approvedReports,
    long rejectedReports,
    long openDisputes,
    long pendingBusinessClaims,
    long verifiedAccessibilityObservations,
    List<AdminAuditLogDto> recentActivities
) {}

