package com.accessmap.dto.ai;

/**
 * Single message exchange unit for AI conversational assistant.
 */
public record AiChatMessage(
    String role,    // "system", "user", "assistant"
    String content
) {
    public static AiChatMessage user(String content) {
        return new AiChatMessage("user", content);
    }

    public static AiChatMessage assistant(String content) {
        return new AiChatMessage("assistant", content);
    }

    public static AiChatMessage system(String content) {
        return new AiChatMessage("system", content);
    }
}

