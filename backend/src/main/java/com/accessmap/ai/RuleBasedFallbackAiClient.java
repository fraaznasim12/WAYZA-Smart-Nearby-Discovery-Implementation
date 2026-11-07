package com.accessmap.ai;

import com.accessmap.dto.ai.AiChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Deterministic, offline-safe AI fallback client.
 * Guarantees that AccessMap features (search parameter parsing, report enhancements,
 * and accessibility explanations) function reliably even without an external LLM API key.
 */
@Component
@Slf4j
public class RuleBasedFallbackAiClient implements AiClient {

    @Override
    public String getProviderName() {
        return "rule-based-fallback";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String completeChat(String systemPrompt, List<AiChatMessage> messages, int maxTokens, double temperature) {
        if (messages == null || messages.isEmpty()) {
            return "Hello! I am your AccessMap accessibility assistant. How can I help you find or understand accessible facilities today?";
        }

        String latestUserQuery = messages.stream()
                .filter(m -> "user".equalsIgnoreCase(m.role()))
                .map(AiChatMessage::content)
                .reduce((first, second) -> second)
                .orElse("")
                .trim()
                .toLowerCase();

        // Check if this was a JSON parameter extraction prompt
        if (systemPrompt != null && systemPrompt.contains("JSON") && systemPrompt.contains("category")) {
            return generateMockSearchJson(latestUserQuery);
        }

        // Conversational responses
        if (latestUserQuery.contains("wheelchair") || latestUserQuery.contains("accessible") || latestUserQuery.contains("ramp")) {
            return "Based on AccessMap records, physical accessibility relies on verified features like step-free entrances, entrance ramps, and wide doors. What specific venue or city would you like to explore?";
        }

        if (latestUserQuery.contains("elevator") || latestUserQuery.contains("lift")) {
            return "Elevator availability is tracked under Vertical Access in our four-state verification model. You can search for multi-level buildings with confirmed working elevators in your area.";
        }

        return "I am here to assist you with verified accessibility records on AccessMap. You can ask me to search for venues by city, category, or specific accessibility features!";
    }

    private String generateMockSearchJson(String query) {
        String category = "null";
        String city = "null";
        String requiredFeature = "[]";

        if (query.contains("hospital") || query.contains("clinic")) {
            category = "\"HOSPITAL\"";
        } else if (query.contains("college") || query.contains("university") || query.contains("school")) {
            category = "\"COLLEGE\"";
        } else if (query.contains("restaurant") || query.contains("cafe") || query.contains("food")) {
            category = "\"RESTAURANT\"";
        } else if (query.contains("station") || query.contains("terminal") || query.contains("transit")) {
            category = "\"TRANSIT_STATION\"";
        } else if (query.contains("park") || query.contains("garden")) {
            category = "\"PARK\"";
        }

        if (query.contains("patna")) city = "\"Patna\"";
        else if (query.contains("delhi")) city = "\"New Delhi\"";
        else if (query.contains("bangalore") || query.contains("bengaluru")) city = "\"Bangalore\"";
        else if (query.contains("mumbai") || query.contains("metro city")) city = "\"Metro City\"";
        else if (query.contains("jharkhand")) city = "\"Jharkhand\"";

        if (query.contains("wheelchair") || query.contains("ramp") || query.contains("entrance") || query.contains("step-free")) {
            requiredFeature = "[\"WHEELCHAIR_ACCESSIBLE_ENTRANCE\"]";
        } else if (query.contains("elevator") || query.contains("lift")) {
            requiredFeature = "[\"ELEVATOR_AVAILABILITY\"]";
        } else if (query.contains("washroom") || query.contains("restroom") || query.contains("toilet")) {
            requiredFeature = "[\"ACCESSIBLE_WASHROOM\"]";
        }

        return String.format("{\"category\": %s, \"city\": %s, \"requiredFeatures\": %s}", category, city, requiredFeature);
    }
}

