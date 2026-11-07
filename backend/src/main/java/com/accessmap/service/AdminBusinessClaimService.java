package com.accessmap.service;

import com.accessmap.dto.PlaceOwnershipDto;
import com.accessmap.entity.PlaceOwnership;
import com.accessmap.entity.User;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.PlaceOwnershipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminBusinessClaimService {

    private final PlaceOwnershipRepository ownershipRepository;
    private final AccessibilityService accessibilityService;
    private final AdminAuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<PlaceOwnershipDto> getClaims(Boolean isVerified, Pageable pageable) {
        Page<PlaceOwnership> page;
        if (isVerified != null) {
            page = ownershipRepository.findAllByIsVerifiedOrderByCreatedAtDesc(isVerified, pageable);
        } else {
            page = ownershipRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(accessibilityService::toOwnershipDto);
    }

    @Transactional
    public PlaceOwnershipDto verifyClaim(UUID claimId, boolean approved, String reason, User adminUser) {
        PlaceOwnership claim = ownershipRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Business ownership claim not found with id: " + claimId));

        claim.setIsVerified(approved);
        claim.setVerifiedAt(approved ? OffsetDateTime.now() : null);
        PlaceOwnership saved = ownershipRepository.save(claim);

        auditLogService.log(
                adminUser,
                approved ? "APPROVE_BUSINESS_CLAIM" : "REJECT_BUSINESS_CLAIM",
                "CLAIM",
                claim.getId(),
                "SUCCESS",
                String.format("Ownership claim for place '%s' by user '%s' (%s) was %s. Reason: %s",
                        claim.getPlace().getName(), claim.getUser().getFullName(), claim.getUser().getEmail(),
                        approved ? "APPROVED" : "REJECTED / REVOKED",
                        reason != null ? reason : "Administrative evaluation")
        );

        try {
            notificationService.notifyClaimReviewed(saved, approved, reason);
        } catch (Exception ex) {
            log.warn("Failed to dispatch claim review notification: {}", ex.getMessage());
        }

        return accessibilityService.toOwnershipDto(saved);
    }
}

