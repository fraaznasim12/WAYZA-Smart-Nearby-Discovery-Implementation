package com.accessmap.service;

import com.accessmap.dto.NotificationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Thread-safe registry managing real-time Server-Sent Events (SSE) connections
 * for active user sessions with automatic heartbeat and disconnect cleanup.
 */
@Component
@Slf4j
public class SseNotificationRegistry {

    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes

    private final Map<UUID, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /**
     * Registers a new SSE emitter for the authenticated user.
     */
    public SseEmitter registerEmitter(UUID userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(ex -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Real-time notification stream established"));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE handshake to user {}: {}", userId, e.getMessage());
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    /**
     * Dispatches a notification to all active SSE connections for a specific user.
     */
    public void sendToUser(UUID userId, NotificationDto notificationDto) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notificationDto));
            } catch (IOException | IllegalStateException e) {
                log.debug("Purging broken SSE emitter for user {}: {}", userId, e.getMessage());
                removeEmitter(userId, emitter);
            }
        }
    }

    /**
     * Broadcasts keep-alive heartbeat comment every 25 seconds to keep intermediary proxies alive.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (userEmitters.isEmpty()) {
            return;
        }

        userEmitters.forEach((userId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } catch (IOException | IllegalStateException e) {
                    removeEmitter(userId, emitter);
                }
            }
        });
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    public int getActiveConnectionCount() {
        return userEmitters.values().stream().mapToInt(List::size).sum();
    }
}

