package com.accessmap.service;

import com.accessmap.dto.AdminAuditLogDto;
import com.accessmap.dto.AdminOverviewStatsDto;
import com.accessmap.entity.DisputeStatus;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.ReportStatus;
import com.accessmap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final AccessibilityReportRepository reportRepository;
    private final DisputeRepository disputeRepository;
    private final PlaceOwnershipRepository ownershipRepository;
    private final AccessibilityFeatureRepository featureRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final AdminAuditLogService auditLogService;

    @Transactional(readOnly = true)
    public AdminOverviewStatsDto getOverviewStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsEnabledTrue();

        long totalPlaces = placeRepository.count();
        long activePlaces = placeRepository.countByIsActiveTrue();

        Map<String, Long> placesByCategory = new LinkedHashMap<>();
        for (Object[] row : placeRepository.countGroupByCategory()) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                placesByCategory.put((String) row[0], ((Number) row[1]).longValue());
            }
        }

        long totalReports = reportRepository.count();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long approvedReports = reportRepository.countByStatus(ReportStatus.APPROVED);
        long rejectedReports = reportRepository.countByStatus(ReportStatus.REJECTED);

        long openDisputes = disputeRepository.countByStatus(DisputeStatus.OPEN);
        long pendingClaims = ownershipRepository.countByIsVerifiedFalse();
        long verifiedFeatures = featureRepository.countByStatus(FeatureStatus.AVAILABLE);

        List<AdminAuditLogDto> recentActivities = auditLogRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10))
                .map(auditLogService::mapToDto)
                .getContent();

        return new AdminOverviewStatsDto(
                totalUsers,
                activeUsers,
                totalPlaces,
                activePlaces,
                placesByCategory,
                totalReports,
                pendingReports,
                approvedReports,
                rejectedReports,
                openDisputes,
                pendingClaims,
                verifiedFeatures,
                recentActivities
        );
    }
}

