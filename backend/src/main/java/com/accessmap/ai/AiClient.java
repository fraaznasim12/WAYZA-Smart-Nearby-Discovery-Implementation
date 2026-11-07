package com.accessmap.ai;

import com.accessmap.dto.ai.AiChatMessage;
import java.util.List;

/**
 * Provider-independent interface for AI completions.
 */
public interface AiClient {

    /**
     * Unique identifier for the provider (e.g. "openai-compatible", "rule-based-fallback").
     */
    String getProviderName();

    /**
     * Returns true if provider has valid configuration and is ready to process requests.
     */
    boolean isAvailable();

    /**
     * Generates a chat completion given system prompt, conversation history, and model parameters.
     */
    String completeChat(String systemPrompt, List<AiChatMessage> messages, int maxTokens, double temperature);
}

