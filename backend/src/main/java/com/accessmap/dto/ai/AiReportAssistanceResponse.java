package com.accessmap.dto.ai;

import java.util.List;

/**
 * Suggestions for enhancing community report clarity and completeness.
 * Suggestions are non-binding and require user approval before submitting.
 */
public record AiReportAssistanceResponse(
    String originalDescription,
    String improvedDescription,
    String suggestedFeatureCode,
    String suggestedFeatureName,
    List<String> missingInformationTips,
    String grammarCorrectionsSummary
) {}

