package com.accessmap.ai;

import com.accessmap.config.AiConfigProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Thread-safe sliding-window rate limiter preventing AI abuse, token exhaustion, and denial of service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiRateLimiterService {

    private final AiConfigProperties properties;
    private final Map<String, ConcurrentLinkedDeque<Long>> requestWindows = new ConcurrentHashMap<>();

    private static final long WINDOW_MS = 60_000L; // 1 minute window

    /**
     * Checks and records a request for the given user or IP key.
     * Throws 429 TOO_MANY_REQUESTS if the rate limit is exceeded.
     */
    public void checkRateLimit(String key) {
        if (!properties.isEnabled()) {
            return;
        }

        int maxPerMinute = properties.getRateLimitPerMinute() > 0 ? properties.getRateLimitPerMinute() : 20;
        long now = System.currentTimeMillis();

        ConcurrentLinkedDeque<Long> window = requestWindows.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        // Evict expired timestamps older than 1 minute
        while (!window.isEmpty() && now - window.peekFirst() > WINDOW_MS) {
            window.pollFirst();
        }

        if (window.size() >= maxPerMinute) {
            log.warn("AI rate limit exceeded for key '{}' ({} requests in last 60s, limit: {})",
                    key, window.size(), maxPerMinute);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "AI request rate limit exceeded. Please wait a minute before making another request.");
        }

        window.addLast(now);
    }

    /**
     * Resets rate limit counters (useful for testing).
     */
    public void reset() {
        requestWindows.clear();
    }
}

