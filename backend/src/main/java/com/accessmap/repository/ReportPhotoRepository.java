package com.accessmap.repository;

import com.accessmap.entity.ReportPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportPhotoRepository extends JpaRepository<ReportPhoto, UUID> {
    List<ReportPhoto> findAllByReportIdOrderByCreatedAtAsc(UUID reportId);
}

