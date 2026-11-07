package com.accessmap.ai;

import com.accessmap.config.AiConfigProperties;
import com.accessmap.dto.ai.AiChatMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI-compatible HTTP REST adapter for external LLM endpoints
 * (OpenAI, Groq, Ollama, vLLM, DeepSeek, or Gemini OpenAI compatibility).
 */
@Component
@Slf4j
public class OpenAiCompatibleAiClient implements AiClient {

    private final AiConfigProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public OpenAiCompatibleAiClient(AiConfigProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        int timeout = properties.getTimeoutSeconds() > 0 ? properties.getTimeoutSeconds() : 15;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeout))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(timeout));

        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public String getProviderName() {
        return "openai-compatible (" + properties.getModel() + ")";
    }

    @Override
    public boolean isAvailable() {
        return properties.isEnabled() &&
                "openai-compatible".equalsIgnoreCase(properties.getProvider()) &&
                properties.hasValidApiKey();
    }

    @Override
    public String completeChat(String systemPrompt, List<AiChatMessage> messages, int maxTokens, double temperature) {
        if (!isAvailable()) {
            throw new IllegalStateException("OpenAI-compatible AI provider is not configured or disabled.");
        }

        try {
            List<Map<String, String>> messagePayloads = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                messagePayloads.add(Map.of("role", "system", "content", systemPrompt));
            }

            if (messages != null) {
                for (AiChatMessage msg : messages) {
                    if (msg != null && msg.content() != null && !msg.content().isBlank()) {
                        messagePayloads.add(Map.of("role", msg.role() != null ? msg.role() : "user", "content", msg.content()));
                    }
                }
            }

            Map<String, Object> body = new HashMap<>();
            body.put("model", properties.getModel());
            body.put("messages", messagePayloads);
            body.put("max_tokens", maxTokens > 0 ? maxTokens : properties.getMaxOutputTokens());
            body.put("temperature", temperature);

            String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode message = choices.get(0).path("message");
                return message.path("content").asText(null);
            }

            return null;
        } catch (Exception ex) {
            log.warn("External AI provider call failed: {}", ex.getMessage());
            throw new RuntimeException("External AI provider invocation failed: " + ex.getMessage(), ex);
        }
    }
}

