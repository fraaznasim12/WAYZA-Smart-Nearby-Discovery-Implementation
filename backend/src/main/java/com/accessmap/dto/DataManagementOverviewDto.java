package com.accessmap.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record DataManagementOverviewDto(
    String providerName,
    boolean providerAvailable,
    OffsetDateTime lastImportAt,
    long totalImportedRecords,
    Map<String, Long> recordsByCategory,
    Map<String, Long> recordsByRegion,
    List<DataImportHistoryDto> recentImports
) {}

