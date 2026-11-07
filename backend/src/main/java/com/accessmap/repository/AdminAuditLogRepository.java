package com.accessmap.repository;

import com.accessmap.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, UUID> {

    Page<AdminAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM AdminAuditLog a WHERE " +
           "(:resourceType IS NULL OR a.resourceType = :resourceType) AND " +
           "(:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
           "ORDER BY a.createdAt DESC")
    Page<AdminAuditLog> findFiltered(
            @Param("resourceType") String resourceType,
            @Param("action") String action,
            Pageable pageable
    );
}

