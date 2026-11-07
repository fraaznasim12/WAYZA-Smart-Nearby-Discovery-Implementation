package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.ai.*;
import com.accessmap.entity.User;
import com.accessmap.service.AiAssistantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller exposing AI-powered accessibility assistant endpoints.
 * All responses are grounded in AccessMap database records.
 */
@RestController
@RequestMapping("/api/v1/ai/assistant")
@RequiredArgsConstructor
@Slf4j
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    /**
     * Natural language place search converting unstructured queries into database-executed filters.
     */
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<AiSearchResponse>> search(
            @Valid @RequestBody AiSearchRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {

        String rateLimitKey = resolveRateLimitKey(user, servletRequest);
        AiSearchResponse response = aiAssistantService.naturalLanguageSearch(request, rateLimitKey);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Plain-language breakdown of a venue's accessibility profile.
     */
    @GetMapping("/explain-place/{placeId}")
    public ResponseEntity<ApiResponse<AiProfileExplanationResponse>> explainPlace(
            @PathVariable UUID placeId,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {

        String rateLimitKey = resolveRateLimitKey(user, servletRequest);
        AiProfileExplanationResponse response = aiAssistantService.explainPlaceProfile(placeId, rateLimitKey);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Report-writing assistant providing grammar formatting and missing-information prompts.
     */
    @PostMapping("/improve-report")
    public ResponseEntity<ApiResponse<AiReportAssistanceResponse>> improveReport(
            @Valid @RequestBody AiReportAssistanceRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {

        String rateLimitKey = resolveRateLimitKey(user, servletRequest);
        AiReportAssistanceResponse response = aiAssistantService.improveReport(request, rateLimitKey);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Interactive conversational assistant answering accessibility inquiries with grounded records.
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @RequestBody AiChatRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {

        String rateLimitKey = resolveRateLimitKey(user, servletRequest);
        AiChatResponse response = aiAssistantService.chat(request, rateLimitKey);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private String resolveRateLimitKey(User user, HttpServletRequest request) {
        if (user != null && user.getId() != null) {
            return "user:" + user.getId();
        }
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return "ip:" + (ip != null ? ip : "unknown");
    }
}

