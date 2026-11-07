package com.accessmap.service;

import com.accessmap.dto.AdminAuditLogDto;
import com.accessmap.entity.AdminAuditLog;
import com.accessmap.entity.User;
import com.accessmap.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditLogService {

    private final AdminAuditLogRepository auditLogRepository;

    @Transactional
    public void log(User actor, String action, String resourceType, UUID resourceId, String outcome, String metadata) {
        try {
            AdminAuditLog logEntry = AdminAuditLog.builder()
                    .actor(actor)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .outcome(outcome != null ? outcome : "SUCCESS")
                    .metadata(metadata)
                    .build();
            auditLogRepository.save(logEntry);
            log.info("AUDIT: User {} performed '{}' on {} [{}] with outcome {}",
                    actor != null ? actor.getEmail() : "SYSTEM", action, resourceType, resourceId, outcome);
        } catch (Exception e) {
            log.error("Failed to write audit log entry: {}", e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogDto> getAuditLogs(String resourceType, String action, Pageable pageable) {
        Page<AdminAuditLog> logs = auditLogRepository.findFiltered(
                (resourceType != null && !resourceType.isBlank()) ? resourceType : null,
                (action != null && !action.isBlank()) ? action : null,
                pageable
        );
        return logs.map(this::mapToDto);
    }

    public AdminAuditLogDto mapToDto(AdminAuditLog log) {
        return new AdminAuditLogDto(
                log.getId(),
                log.getActor() != null ? log.getActor().getId() : null,
                log.getActor() != null ? log.getActor().getFullName() : "System",
                log.getActor() != null ? log.getActor().getEmail() : "system@accessmap.local",
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getOutcome(),
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}

