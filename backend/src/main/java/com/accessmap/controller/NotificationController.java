package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.NotificationDto;
import com.accessmap.dto.NotificationPreferenceDto;
import com.accessmap.dto.NotificationPreferenceUpdateRequest;
import com.accessmap.dto.UnreadCountDto;
import com.accessmap.entity.User;
import com.accessmap.service.NotificationService;
import com.accessmap.service.SseNotificationRegistry;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

/**
 * Controller exposing notification endpoints for fetching alerts, managing preferences,
 * and establishing real-time SSE event streaming.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final SseNotificationRegistry sseNotificationRegistry;

    /**
     * Retrieves paginated notifications for the authenticated user, optionally filtered by read status.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<NotificationDto> notifications = notificationService.getNotifications(user, isRead, pageable);
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    /**
     * Retrieves unread notification counter for the authenticated user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountDto>> getUnreadCount(@AuthenticationPrincipal User user) {
        UnreadCountDto unreadCount = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(ApiResponse.ok(unreadCount));
    }

    /**
     * Marks a specific notification as read. Enforces IDOR security.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        NotificationDto updated = notificationService.markAsRead(id, user);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Marks all notifications as read for the authenticated user.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * Retrieves all delivery channel preferences for the authenticated user.
     */
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceDto>>> getPreferences(
            @AuthenticationPrincipal User user) {
        List<NotificationPreferenceDto> preferences = notificationService.getPreferences(user);
        return ResponseEntity.ok(ApiResponse.ok(preferences));
    }

    /**
     * Updates notification channel preferences for the authenticated user.
     */
    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceDto>>> updatePreferences(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody List<NotificationPreferenceUpdateRequest> updates) {
        List<NotificationPreferenceDto> updated = notificationService.updatePreferences(user, updates);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * Establishes a real-time Server-Sent Events (SSE) connection authenticated via Bearer token.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal User user) {
        log.info("Client connected to SSE notification stream: user ID {}", user.getId());
        return sseNotificationRegistry.registerEmitter(user.getId());
    }
}

