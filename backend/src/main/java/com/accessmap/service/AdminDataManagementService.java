package com.accessmap.service;

import com.accessmap.dto.DataImportHistoryDto;
import com.accessmap.dto.DataManagementOverviewDto;
import com.accessmap.dto.OsmImportRequest;
import com.accessmap.dto.OsmImportResult;
import com.accessmap.entity.DataImportHistory;
import com.accessmap.entity.User;
import com.accessmap.provider.PlaceDataProvider;
import com.accessmap.repository.DataImportHistoryRepository;
import com.accessmap.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDataManagementService {

    private final PlaceDataProvider placeDataProvider;
    private final PlaceRepository placeRepository;
    private final DataImportHistoryRepository importHistoryRepository;
    private final OsmImportService osmImportService;
    private final AdminAuditLogService auditLogService;

    @Transactional(readOnly = true)
    public DataManagementOverviewDto getOverview() {
        String providerName = placeDataProvider.getProviderName();
        boolean isAvailable = placeDataProvider.isAvailable();

        Optional<DataImportHistory> lastImport = importHistoryRepository.findTop1ByOrderByCreatedAtDesc();
        OffsetDateTime lastImportAt = lastImport.map(DataImportHistory::getCreatedAt).orElse(null);

        long totalImported = placeRepository.count();

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : placeRepository.countGroupByCategory()) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                byCategory.put((String) row[0], ((Number) row[1]).longValue());
            }
        }

        Map<String, Long> byRegion = new LinkedHashMap<>();
        for (Object[] row : placeRepository.countGroupByState()) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                byRegion.put((String) row[0], ((Number) row[1]).longValue());
            }
        }

        List<DataImportHistoryDto> recent = importHistoryRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .map(this::mapToDto)
                .getContent();

        return new DataManagementOverviewDto(
                providerName,
                isAvailable,
                lastImportAt,
                totalImported,
                byCategory,
                byRegion,
                recent
        );
    }

    @Transactional(readOnly = true)
    public Page<DataImportHistoryDto> getImportHistory(Pageable pageable) {
        return importHistoryRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    }

    @Transactional
    public OsmImportResult triggerRegionalImport(String region, double south, double west, double north, double east, List<String> categories, User adminUser) {
        log.info("Admin {} initiated regional import for region '{}' [{},{},{},{}]",
                adminUser.getEmail(), region, south, west, north, east);

        OsmImportRequest request = new OsmImportRequest(south, west, north, east, categories);
        OsmImportResult result = osmImportService.importByBoundingBox(request);

        String status = result.importedCount() > 0 ? "COMPLETED" : (result.failedCount() > 0 ? "FAILED" : "COMPLETED");

        DataImportHistory history = DataImportHistory.builder()
                .providerName(result.provider())
                .regionName(region)
                .boundingBox(String.format("%.4f,%.4f,%.4f,%.4f", south, west, north, east))
                .status(status)
                .recordsImported(result.importedCount())
                .recordsSkipped(result.skippedCount())
                .recordsFailed(result.failedCount())
                .errorMessage(result.message())
                .initiatedBy(adminUser)
                .build();

        importHistoryRepository.save(history);

        auditLogService.log(
                adminUser,
                "TRIGGER_GEODATA_IMPORT",
                "DATA_IMPORT",
                history.getId(),
                status,
                String.format("Import for region '%s': %d imported, %d skipped, %d failed",
                        region, result.importedCount(), result.skippedCount(), result.failedCount())
        );

        return result;
    }

    private DataImportHistoryDto mapToDto(DataImportHistory h) {
        return new DataImportHistoryDto(
                h.getId(),
                h.getProviderName(),
                h.getRegionName(),
                h.getBoundingBox(),
                h.getStatus(),
                h.getRecordsImported(),
                h.getRecordsSkipped(),
                h.getRecordsFailed(),
                h.getErrorMessage(),
                h.getInitiatedBy() != null ? h.getInitiatedBy().getEmail() : null,
                h.getCreatedAt()
        );
    }
}
