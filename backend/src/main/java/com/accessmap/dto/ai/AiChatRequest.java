package com.accessmap.dto.ai;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Incoming request for the AI Accessibility Assistant.
 */
public record AiChatRequest(
    String message,
    List<AiChatMessage> history,
    UUID placeId,
    Double latitude,
    Double longitude
) {}

