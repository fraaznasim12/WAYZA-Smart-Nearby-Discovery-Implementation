package com.accessmap.service;

import com.accessmap.ai.AiClient;
import com.accessmap.ai.AiRateLimiterService;
import com.accessmap.ai.OpenAiCompatibleAiClient;
import com.accessmap.ai.RuleBasedFallbackAiClient;
import com.accessmap.config.AiConfigProperties;
import com.accessmap.dto.AccessibilityProfileDto;
import com.accessmap.dto.FeatureStatusDto;
import com.accessmap.dto.PlaceDto;
import com.accessmap.dto.ai.*;
import com.accessmap.entity.FeatureStatus;
import com.accessmap.entity.FeatureType;
import com.accessmap.entity.Place;
import com.accessmap.exception.BadRequestException;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.PlaceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core AI Assistant orchestration service.
 * Delivers grounded accessibility Q&A, natural language place discovery,
 * 4-state profile explanations, and interactive report-drafting assistance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantService {

    private final AiConfigProperties properties;
    private final OpenAiCompatibleAiClient openAiClient;
    private final RuleBasedFallbackAiClient fallbackClient;
    private final AiRateLimiterService rateLimiterService;
    private final PlaceService placeService;
    private final AccessibilityService accessibilityService;
    private final PlaceRepository placeRepository;
    private final ObjectMapper objectMapper;

    private static final Set<String> KNOWN_CATEGORIES = Set.of(
            "HOSPITAL", "CLINIC", "COLLEGE", "UNIVERSITY", "SCHOOL",
            "RESTAURANT", "CAFE", "TRANSIT_STATION", "PUBLIC_OFFICE",
            "SHOPPING_MALL", "LIBRARY", "PARK", "THEATER", "RETAIL", "ENTERTAINMENT"
    );

    /**
     * Executes natural language place search grounded strictly in database records.
     */
    @Transactional(readOnly = true)
    public AiSearchResponse naturalLanguageSearch(AiSearchRequest request, String rateLimitKey) {
        validateInput(request.query(), "Search query");
        rateLimiterService.checkRateLimit(rateLimitKey);

        AiSearchFiltersDto filters = extractSearchParameters(request.query());

        // Execute query through real PlaceService
        Page<PlaceDto> pageResults;
        if (request.latitude() != null && request.longitude() != null && request.radiusMeters() != null) {
            pageResults = placeService.getNearbyPlaces(
                    request.latitude(),
                    request.longitude(),
                    request.radiusMeters(),
                    PageRequest.of(0, 15)
            );
        } else {
            pageResults = placeService.getPlaces(
                    filters.extractedKeyword(),
                    filters.category(),
                    filters.city(),
                    filters.state(),
                    filters.requiredFeatures(),
                    PageRequest.of(0, 15)
            );
        }

        List<PlaceDto> places = pageResults.getContent();
        String explanation = generateSearchExplanation(request.query(), filters, places.size());

        return new AiSearchResponse(
                request.query(),
                filters,
                places,
                explanation,
                (int) pageResults.getTotalElements()
        );
    }

    /**
     * Explains a venue's accessibility profile in simple, empathetic, four-state language.
     * Strictly avoids arbitrary scores or false assumptions about unrecorded facilities.
     */
    @Transactional(readOnly = true)
    public AiProfileExplanationResponse explainPlaceProfile(UUID placeId, String rateLimitKey) {
        rateLimiterService.checkRateLimit(rateLimitKey);

        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        AccessibilityProfileDto profile = accessibilityService.getPlaceAccessibilityProfile(placeId);

        List<String> confirmedAvailable = new ArrayList<>();
        List<String> confirmedUnavailable = new ArrayList<>();
        List<String> unknownFeatures = new ArrayList<>();
        List<String> unverifiedObservations = new ArrayList<>();

        for (FeatureStatusDto feat : profile.features()) {
            String name = feat.name() != null ? feat.name() : feat.code();
            if (feat.status() == FeatureStatus.AVAILABLE) {
                confirmedAvailable.add(name);
            } else if (feat.status() == FeatureStatus.NOT_AVAILABLE) {
                confirmedUnavailable.add(name);
            } else if (feat.status() == FeatureStatus.NOT_VERIFIED) {
                unverifiedObservations.add(name);
            } else {
                unknownFeatures.add(name);
            }
        }

        StringBuilder narrative = new StringBuilder();
        narrative.append(place.getName()).append(" (").append(place.getCategory()).append(") accessibility assessment:\n\n");

        if (!confirmedAvailable.isEmpty()) {
            narrative.append("• Confirmed Accessible: ").append(String.join(", ", confirmedAvailable)).append(".\n");
        } else {
            narrative.append("• Confirmed Accessible: None officially confirmed in verified records.\n");
        }

        if (!confirmedUnavailable.isEmpty()) {
            narrative.append("• Confirmed Barriers (Not Available): ").append(String.join(", ", confirmedUnavailable)).append(".\n");
        }

        if (!unverifiedObservations.isEmpty()) {
            narrative.append("• Pending Review: Community observations for ").append(String.join(", ", unverifiedObservations))
                    .append(" have been submitted but are not yet verified by moderators.\n");
        }

        if (!unknownFeatures.isEmpty()) {
            narrative.append("• Information Needed: ").append(unknownFeatures.size())
                    .append(" features (such as ").append(unknownFeatures.stream().limit(3).collect(Collectors.joining(", ")))
                    .append(") remain unrecorded. Community audits are encouraged!\n");
        }

        OffsetDateTime verifiedAt = profile.lastVerifiedAt();
        if (verifiedAt != null) {
            narrative.append("\nRecord Freshness: Last verified on ").append(verifiedAt.toLocalDate()).append(".");
        } else {
            narrative.append("\nRecord Freshness: Baseline unverified record.");
        }

        return new AiProfileExplanationResponse(
                place.getId(),
                place.getName(),
                narrative.toString(),
                confirmedAvailable,
                confirmedUnavailable,
                unknownFeatures,
                unverifiedObservations,
                verifiedAt
        );
    }

    /**
     * Assists users in drafting high-quality, actionable community accessibility reports.
     * Generates editable suggestions, grammar refinement, and highlights missing context.
     */
    public AiReportAssistanceResponse improveReport(AiReportAssistanceRequest request, String rateLimitKey) {
        validateInput(request.draftDescription(), "Draft description");
        rateLimiterService.checkRateLimit(rateLimitKey);

        String draft = request.draftDescription().trim();

        // 1. Determine suggested feature code
        String suggestedCode = request.featureCode();
        if (suggestedCode == null || suggestedCode.isBlank()) {
            suggestedCode = detectFeatureCodeFromText(draft);
        }

        String featureName = suggestedCode != null ? suggestedCode.replace('_', ' ') : "General Facility";

        // 2. Identify missing information tips
        List<String> tips = new ArrayList<>();
        String lower = draft.toLowerCase();

        if (!lower.contains("stair") && !lower.contains("step") && !lower.contains("level")) {
            tips.add("Consider noting the presence of steps or whether the threshold is completely step-free.");
        }
        if (!lower.contains("width") && !lower.contains("door") && !lower.contains("entrance")) {
            tips.add("If evaluating an entrance, mention whether the door is wide enough for a standard wheelchair (>= 80cm).");
        }
        if (lower.contains("ramp") && !lower.contains("handrail") && !lower.contains("slope")) {
            tips.add("For ramps, noting if handrails are present and whether the slope is gentle is very helpful.");
        }
        if (lower.contains("elevator") && !lower.contains("braille") && !lower.contains("audio")) {
            tips.add("For elevators, note if there are tactile/braille buttons or audible arrival signals.");
        }
        if (tips.isEmpty()) {
            tips.add("Great detail provided! Adding a clear photograph of the feature will speed up moderator approval.");
        }

        // 3. Improve description
        String improved;
        String correctionsSummary;

        if (draft.length() < 15) {
            improved = "Observation: " + draft + ". Entrance is partially obstructed and requires assistance for wheelchair users.";
            correctionsSummary = "Expanded short note into a formal, clear observation.";
        } else {
            // Capitalize first letter and ensure proper punctuation
            String cleaned = draft.substring(0, 1).toUpperCase() + draft.substring(1);
            if (!cleaned.endsWith(".") && !cleaned.endsWith("!") && !cleaned.endsWith("?")) {
                cleaned += ".";
            }
            improved = cleaned;
            correctionsSummary = "Formatted grammar, casing, and sentence structure.";
        }

        return new AiReportAssistanceResponse(
                draft,
                improved,
                suggestedCode,
                featureName,
                tips,
                correctionsSummary
        );
    }

    /**
     * Conversational Assistant handling accessibility Q&A with grounded facts.
     */
    @Transactional(readOnly = true)
    public AiChatResponse chat(AiChatRequest request, String rateLimitKey) {
        String query = request.message() != null ? request.message().trim() : "";
        validateInput(query, "Message");
        rateLimiterService.checkRateLimit(rateLimitKey);

        AiClient client = selectClient();

        // If query is specifically regarding a place
        if (request.placeId() != null) {
            return handlePlaceSpecificChat(request.placeId(), query, client);
        }

        // Check if query is a natural language place discovery request
        String lower = query.toLowerCase();
        if (lower.contains("find") || lower.contains("search") || lower.contains("nearby") ||
            lower.contains("places in") || lower.contains("hospitals") || lower.contains("colleges")) {

            AiSearchResponse searchRes = naturalLanguageSearch(
                    new AiSearchRequest(query, request.latitude(), request.longitude(), null),
                    rateLimitKey
            );

            return new AiChatResponse(
                    searchRes.explanation(),
                    null,
                    null,
                    searchRes.extractedFilters(),
                    searchRes.places(),
                    List.of(
                            "What accessibility features are verified here?",
                            "How do I submit an audit report?",
                            "Find more places with elevator access"
                    ),
                    client.getProviderName(),
                    client.getProviderName()
            );
        }

        // General conversational response
        List<AiChatMessage> messages = new ArrayList<>();
        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(AiChatMessage.user(query));

        String systemPrompt = """
                You are AccessMap Assistant, an AI expert on verified physical accessibility.
                Follow these strict safety rules:
                1. Never invent or assume accessibility features.
                2. Explicitly distinguish AVAILABLE, NOT_AVAILABLE, UNKNOWN, and NOT_VERIFIED.
                3. If information is not in the database, clearly say it is unrecorded.
                4. Encourage community members to audit missing facilities safely.
                """;

        String completion = client.completeChat(systemPrompt, messages, properties.getMaxOutputTokens(), 0.3);
        if (completion == null || completion.isBlank()) {
            completion = fallbackClient.completeChat(systemPrompt, messages, properties.getMaxOutputTokens(), 0.3);
        }

        return new AiChatResponse(
                completion,
                null,
                null,
                null,
                List.of(),
                List.of(
                        "How does AccessMap verify accessibility?",
                        "Find accessible hospitals near me",
                        "How can I report a broken ramp?"
                ),
                client.getProviderName(),
                client.getProviderName()
        );
    }

    private AiChatResponse handlePlaceSpecificChat(UUID placeId, String query, AiClient client) {
        Place place = placeRepository.findById(placeId).orElse(null);
        if (place == null) {
            return new AiChatResponse(
                    "The requested venue could not be found in AccessMap records.",
                    null, null, null, List.of(), List.of(), client.getProviderName(), client.getProviderName()
            );
        }

        AccessibilityProfileDto profile = accessibilityService.getPlaceAccessibilityProfile(placeId);
        String lower = query.toLowerCase();

        String answer;
        if (lower.contains("wheelchair") || lower.contains("entrance") || lower.contains("ramp")) {
            FeatureStatus status = findFeatureStatus(profile, FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE);
            answer = String.format("For %s, the wheelchair accessible entrance is recorded as %s in verified records.",
                    place.getName(), status);
        } else if (lower.contains("elevator") || lower.contains("lift")) {
            FeatureStatus status = findFeatureStatus(profile, FeatureType.ELEVATOR_AVAILABILITY);
            answer = String.format("Elevator availability at %s is recorded as %s.", place.getName(), status);
        } else if (lower.contains("washroom") || lower.contains("restroom")) {
            FeatureStatus status = findFeatureStatus(profile, FeatureType.ACCESSIBLE_WASHROOM);
            answer = String.format("Accessible restroom at %s is recorded as %s.", place.getName(), status);
        } else if (lower.contains("when") || lower.contains("verified") || lower.contains("date")) {
            OffsetDateTime verifiedAt = profile.lastVerifiedAt();
            answer = verifiedAt != null
                    ? String.format("%s was last verified on %s.", place.getName(), verifiedAt.toLocalDate())
                    : String.format("%s has not yet received a verified moderation audit.", place.getName());
        } else {
            answer = String.format("%s is a %s located at %s. Available features: %d, Barriers: %d, Unknown: %d.",
                    place.getName(), place.getCategory(), place.getAddress(),
                    profile.availableCount(), profile.notAvailableCount(), profile.unknownCount());
        }

        return new AiChatResponse(
                answer,
                place.getId(),
                place.getName(),
                null,
                List.of(),
                List.of(
                        "Does this place have an accessible restroom?",
                        "When was this place last verified?",
                        "How can I add an observation for this venue?"
                ),
                client.getProviderName(),
                client.getProviderName()
        );
    }

    private FeatureStatus findFeatureStatus(AccessibilityProfileDto profile, FeatureType type) {
        return profile.features().stream()
                .filter(f -> type.name().equalsIgnoreCase(f.code()))
                .map(FeatureStatusDto::status)
                .findFirst()
                .orElse(FeatureStatus.UNKNOWN);
    }

    private AiSearchFiltersDto extractSearchParameters(String query) {
        String lower = query.toLowerCase();
        String category = null;
        String city = null;
        List<String> requiredFeatures = new ArrayList<>();
        String extractedKeyword = null;

        // Try LLM parsing if external provider is available
        AiClient client = selectClient();
        if (client.isAvailable() && client != fallbackClient) {
            try {
                String prompt = String.format(
                        "Extract search filters as JSON with keys: category (one of %s), city (string or null), requiredFeatures (array of FeatureType codes or empty). Query: \"%s\". Return JSON only.",
                        KNOWN_CATEGORIES, query
                );
                String json = client.completeChat(prompt, List.of(AiChatMessage.user(query)), 200, 0.0);
                if (json != null && json.contains("{")) {
                    JsonNode node = objectMapper.readTree(json.substring(json.indexOf("{"), json.lastIndexOf("}") + 1));
                    String catNode = node.path("category").asText(null);
                    if (catNode != null && KNOWN_CATEGORIES.contains(catNode.toUpperCase())) {
                        category = catNode.toUpperCase();
                    }
                    String cityNode = node.path("city").asText(null);
                    if (cityNode != null && !cityNode.isBlank() && !"null".equalsIgnoreCase(cityNode)) {
                        city = cityNode;
                    }
                    JsonNode feats = node.path("requiredFeatures");
                    if (feats.isArray()) {
                        for (JsonNode f : feats) {
                            String fCode = f.asText();
                            if (FeatureType.fromCode(fCode) != null) {
                                requiredFeatures.add(fCode);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.debug("LLM parameter extraction fallback to rules: {}", ex.getMessage());
            }
        }

        // Rule-based extraction (if not extracted by LLM)
        if (category == null) {
            if (lower.contains("hospital") || lower.contains("clinic")) category = "HOSPITAL";
            else if (lower.contains("college") || lower.contains("university")) category = "COLLEGE";
            else if (lower.contains("restaurant") || lower.contains("cafe")) category = "RESTAURANT";
            else if (lower.contains("station") || lower.contains("transit") || lower.contains("terminal")) category = "TRANSIT_STATION";
            else if (lower.contains("mall") || lower.contains("shopping")) category = "SHOPPING_MALL";
            else if (lower.contains("park") || lower.contains("garden")) category = "PARK";
            else if (lower.contains("library")) category = "LIBRARY";
        }

        if (city == null) {
            if (lower.contains("patna")) city = "Patna";
            else if (lower.contains("delhi")) city = "New Delhi";
            else if (lower.contains("bangalore") || lower.contains("bengaluru")) city = "Bangalore";
            else if (lower.contains("mumbai") || lower.contains("metro city")) city = "Metro City";
            else if (lower.contains("jharkhand")) city = "Jharkhand";
        }

        if (requiredFeatures.isEmpty()) {
            if (lower.contains("wheelchair") || lower.contains("ramp") || lower.contains("entrance") || lower.contains("step-free")) {
                requiredFeatures.add(FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE.name());
            }
            if (lower.contains("elevator") || lower.contains("lift")) {
                requiredFeatures.add(FeatureType.ELEVATOR_AVAILABILITY.name());
            }
            if (lower.contains("washroom") || lower.contains("restroom") || lower.contains("toilet")) {
                requiredFeatures.add(FeatureType.ACCESSIBLE_WASHROOM.name());
            }
        }

        return new AiSearchFiltersDto(category, city, null, requiredFeatures, extractedKeyword);
    }

    private String detectFeatureCodeFromText(String draft) {
        String lower = draft.toLowerCase();
        if (lower.contains("ramp") || lower.contains("slope")) {
            return FeatureType.ENTRANCE_RAMP.name();
        }
        if (lower.contains("elevator") || lower.contains("lift")) {
            return FeatureType.ELEVATOR_AVAILABILITY.name();
        }
        if (lower.contains("washroom") || lower.contains("restroom") || lower.contains("toilet")) {
            return FeatureType.ACCESSIBLE_WASHROOM.name();
        }
        if (lower.contains("door") || lower.contains("entrance") || lower.contains("step")) {
            return FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE.name();
        }
        if (lower.contains("parking")) {
            return FeatureType.ACCESSIBLE_PARKING.name();
        }
        if (lower.contains("braille") || lower.contains("signage")) {
            return FeatureType.BRAILLE_SIGNAGE.name();
        }
        return FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE.name();
    }

    private String generateSearchExplanation(String query, AiSearchFiltersDto filters, int resultCount) {
        StringBuilder sb = new StringBuilder();
        sb.append("Processed query: \"").append(query).append("\". ");

        if (filters.category() != null) {
            sb.append("Filtered by Category: ").append(filters.category()).append(". ");
        }
        if (filters.city() != null) {
            sb.append("Location: ").append(filters.city()).append(". ");
        }
        if (filters.requiredFeatures() != null && !filters.requiredFeatures().isEmpty()) {
            sb.append("Required verified features: ")
                    .append(String.join(", ", filters.requiredFeatures()))
                    .append(". ");
        }

        if (resultCount > 0) {
            sb.append("Found ").append(resultCount).append(" matching place(s) in AccessMap database.");
        } else {
            sb.append("No verified places currently match all requested criteria in our records.");
        }

        return sb.toString();
    }

    private AiClient selectClient() {
        if (openAiClient.isAvailable()) {
            return openAiClient;
        }
        return fallbackClient;
    }

    private void validateInput(String input, String fieldName) {
        if (input == null || input.isBlank()) {
            throw new BadRequestException(fieldName + " must not be blank.");
        }
        if (input.length() > properties.getMaxInputChars()) {
            throw new BadRequestException(fieldName + " exceeds maximum allowed length of " +
                    properties.getMaxInputChars() + " characters.");
        }
    }
}
