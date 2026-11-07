package com.accessmap.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for AccessMap AI Provider and Assistant.
 */
@Component
@ConfigurationProperties(prefix = "accessmap.ai")
@Data
public class AiConfigProperties {

    /** Whether AI functionality is active on the platform. */
    private boolean enabled = true;

    /** Active provider adapter: 'mock' or 'openai-compatible'. */
    private String provider = "mock";

    /** Provider API base URL (defaults to standard OpenAI endpoint). */
    private String baseUrl = "https://api.openai.com/v1";

    /** Provider API Key (never exposed to frontend). */
    private String apiKey = "";

    /** Model identifier (e.g. gpt-4o-mini, llama-3, gemini-1.5-flash). */
    private String model = "gpt-4o-mini";

    /** Maximum timeout for external provider invocations in seconds. */
    private int timeoutSeconds = 15;

    /** Input character limit to prevent token exhaustion and prompt injection. */
    private int maxInputChars = 1000;

    /** Maximum tokens to generate in response. */
    private int maxOutputTokens = 600;

    /** Maximum requests allowed per user or IP per minute. */
    private int rateLimitPerMinute = 20;

    public boolean hasValidApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}

