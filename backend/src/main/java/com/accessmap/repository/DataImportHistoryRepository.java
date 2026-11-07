package com.accessmap.repository;

import com.accessmap.entity.DataImportHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DataImportHistoryRepository extends JpaRepository<DataImportHistory, UUID> {

    Page<DataImportHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<DataImportHistory> findTop1ByOrderByCreatedAtDesc();
}

