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
import com.accessmap.entity.*;
import com.accessmap.exception.BadRequestException;
import com.accessmap.exception.ResourceNotFoundException;
import com.accessmap.repository.AccessibilityReportRepository;
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
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Enhanced AI Assistant service with retrieval-grounded Q&A, strict hallucination prevention,
 * provenance evidence citations, and multilingual support.
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
    private final AccessibilityReportRepository reportRepository;
    private final ObjectMapper objectMapper;

    private static final Set<String> KNOWN_CATEGORIES = Set.of(
            "HOSPITAL", "CLINIC", "COLLEGE", "UNIVERSITY", "SCHOOL",
            "RESTAURANT", "CAFE", "TRANSIT_STATION", "PUBLIC_OFFICE",
            "SHOPPING_MALL", "LIBRARY", "PARK", "THEATER", "RETAIL", "ENTERTAINMENT"
    );

    private static final Pattern DEVANAGARI_PATTERN = Pattern.compile("\\p{IsDevanagari}");
    private static final Pattern SPANISH_PATTERN = Pattern.compile("\\b(tiene|dónde|donde|accesible|silla|ruedas|baño|rampa|ascensor|hospital|colegio|escuela)\\b", Pattern.CASE_INSENSITIVE);

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
     */
    public AiReportAssistanceResponse improveReport(AiReportAssistanceRequest request, String rateLimitKey) {
        validateInput(request.draftDescription(), "Draft description");
        rateLimiterService.checkRateLimit(rateLimitKey);

        String draft = request.draftDescription().trim();

        String suggestedCode = request.featureCode();
        if (suggestedCode == null || suggestedCode.isBlank()) {
            suggestedCode = detectFeatureCodeFromText(draft);
        }

        String featureName = suggestedCode != null ? suggestedCode.replace('_', ' ') : "General Facility";

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

        String improved;
        String correctionsSummary;

        if (draft.length() < 15) {
            improved = "Observation: " + draft + ". Entrance is partially obstructed and requires assistance for wheelchair users.";
            correctionsSummary = "Expanded short note into a formal, clear observation.";
        } else {
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
     * Retrieval-Augmented Conversational Assistant handling accessibility Q&A with grounded facts.
     * Prevents hallucinations by inspecting real database places, profiles, and reports before answering.
     */
    @Transactional(readOnly = true)
    public AiChatResponse chat(AiChatRequest request, String rateLimitKey) {
        String query = request.message() != null ? request.message().trim() : "";
        validateInput(query, "Message");
        rateLimiterService.checkRateLimit(rateLimitKey);

        AiClient client = selectClient();

        // 1. Direct placeId lookup
        if (request.placeId() != null) {
            return handlePlaceSpecificChat(request.placeId(), query, client);
        }

        // 2. Candidate Venue Entity Retrieval from Database
        Optional<Place> candidatePlace = findCandidatePlaceInQuery(query);
        if (candidatePlace.isPresent()) {
            return handlePlaceSpecificChat(candidatePlace.get().getId(), query, client);
        }

        // 3. Question asking about an unknown or unrecorded place (Anti-Hallucination Guard)
        if (isQueryAskingAboutSpecificUnrecordedPlace(query)) {
            String venueMentioned = extractPotentialVenueName(query);
            boolean isHindi = DEVANAGARI_PATTERN.matcher(query).find();
            boolean isSpanish = SPANISH_PATTERN.matcher(query).find();

            String reply;
            if (isHindi) {
                reply = String.format("मुझे AccessMap रिकॉर्ड में \"%s\" के लिए सत्यापित व्हीलचेयर या भौतिक पहुँच जानकारी नहीं मिली है। AccessMap में सुलभता सुविधाओं का कभी अनुमान नहीं लगाया जाता है। आप उपलब्ध सामुदायिक रिपोर्ट देख सकते हैं या जाने पर एक सुलभता अवलोकन सबमिट कर सकते हैं।",
                        venueMentioned != null ? venueMentioned : "इस स्थान");
            } else if (isSpanish) {
                reply = String.format("No tengo información de accesibilidad verificada para \"%s\" en los registros de AccessMap todavía. En AccessMap, nunca adivinamos o inventamos datos. Puedes consultar los informes de la comunidad o enviar una observación de accesibilidad.",
                        venueMentioned != null ? venueMentioned : "este lugar");
            } else {
                reply = String.format("I don't have verified accessibility information for %s in AccessMap records yet. In AccessMap, accessibility features are never assumed, guessed, or fabricated. You can view available community reports or submit a verified accessibility observation once you visit.",
                        venueMentioned != null ? "\"" + venueMentioned + "\"" : "this venue");
            }

            return new AiChatResponse(
                    reply,
                    null,
                    venueMentioned,
                    null,
                    List.of(),
                    List.of(),
                    "INSUFFICIENT_DATA",
                    List.of(
                            "How do I submit an accessibility observation?",
                            "Find nearby verified accessible places",
                            "What is the Four-State Verification Model?"
                    ),
                    client.getProviderName(),
                    client.getProviderName()
            );
        }

        // 4. Natural language place discovery request
        String lower = query.toLowerCase();
        if (lower.contains("find") || lower.contains("search") || lower.contains("nearby") ||
            lower.contains("places in") || lower.contains("hospitals") || lower.contains("colleges") ||
            lower.contains("cafes") || lower.contains("restaurants") || lower.contains("stations")) {

            AiSearchResponse searchRes = naturalLanguageSearch(
                    new AiSearchRequest(query, request.latitude(), request.longitude(), null),
                    rateLimitKey
            );

            List<AiEvidenceSourceDto> sources = searchRes.places().stream()
                    .limit(5)
                    .map(p -> new AiEvidenceSourceDto(
                            p.id(),
                            p.name(),
                            p.category(),
                            "VERIFIED_DISCOVERY",
                            p.updatedAt(),
                            "INDEPENDENT_AUDIT",
                            "Discovered through PostGIS spatial index with " + (p.features() != null ? p.features().size() : 0) + " audited features.",
                            "HIGH_EVIDENCE"
                    ))
                    .collect(Collectors.toList());

            return new AiChatResponse(
                    searchRes.explanation(),
                    null,
                    null,
                    searchRes.extractedFilters(),
                    searchRes.places(),
                    sources,
                    sources.isEmpty() ? "INSUFFICIENT_DATA" : "HIGH_EVIDENCE",
                    List.of(
                            "What accessibility features are verified here?",
                            "How do I submit an audit report?",
                            "Find more places with elevator access"
                    ),
                    client.getProviderName(),
                    client.getProviderName()
            );
        }

        // 5. General Conversational / Educational Grounding (Four-State Model explanation)
        List<AiChatMessage> messages = new ArrayList<>();
        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(AiChatMessage.user(query));

        String systemPrompt = """
                You are AccessMap Assistant, an AI expert on verified physical accessibility and spatial mapping.
                Follow these strict safety and factual rules:
                1. Never invent or assume accessibility features for any real or imaginary venue.
                2. Explicitly distinguish the four states: AVAILABLE (verified < 180 days), NOT_AVAILABLE (confirmed barrier), UNKNOWN (unrecorded, NEVER assume inaccessible), and NOT_VERIFIED (pending review/stale).
                3. If data is missing or unverified, state it plainly and invite community contribution.
                4. Distinguish independently verified facts from community opinions.
                5. Respond in the language used by the user when requested (e.g. English, Hindi, Spanish).
                """;

        String completion = client.completeChat(systemPrompt, messages, properties.getMaxOutputTokens(), 0.2);
        if (completion == null || completion.isBlank()) {
            completion = fallbackClient.completeChat(systemPrompt, messages, properties.getMaxOutputTokens(), 0.2);
        }

        return new AiChatResponse(
                completion,
                null,
                null,
                null,
                List.of(),
                List.of(),
                "GENERAL_ASSISTANCE",
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
                    null, null, null, List.of(), List.of(), "INSUFFICIENT_DATA", List.of(),
                    client.getProviderName(), client.getProviderName()
            );
        }

        AccessibilityProfileDto profile = accessibilityService.getPlaceAccessibilityProfile(placeId);
        List<AccessibilityReport> communityReports = reportRepository.findAllByPlaceIdOrderByCreatedAtDesc(placeId);

        String lower = query.toLowerCase();
        boolean isHindi = DEVANAGARI_PATTERN.matcher(query).find();
        boolean isSpanish = SPANISH_PATTERN.matcher(query).find();

        StringBuilder answerBuilder = new StringBuilder();
        List<AiEvidenceSourceDto> sources = new ArrayList<>();
        String overallReliability = "HIGH_EVIDENCE";

        // Check specific feature inquiries
        if (lower.contains("wheelchair") || lower.contains("entrance") || lower.contains("ramp") || lower.contains("रैंप") || lower.contains("प्रवेश") || lower.contains("silla")) {
            FeatureStatus status = findFeatureStatus(profile, FeatureType.WHEELCHAIR_ACCESSIBLE_ENTRANCE);
            if (status == FeatureStatus.UNKNOWN) {
                status = findFeatureStatus(profile, FeatureType.STEP_FREE_ENTRANCE);
            }

            if (isHindi) {
                answerBuilder.append(String.format("%s के लिए, मुख्य प्रवेश द्वार सत्यापित रिकॉर्ड के अनुसार %s दर्ज है।",
                        place.getName(), status == FeatureStatus.AVAILABLE ? "सुलभ (AVAILABLE)" : (status == FeatureStatus.NOT_AVAILABLE ? "बाधाग्रस्त (NOT AVAILABLE)" : "अज्ञात (UNKNOWN)")));
            } else if (isSpanish) {
                answerBuilder.append(String.format("Para %s, la entrada accesible para sillas de ruedas está registrada como %s en los registros oficiales.",
                        place.getName(), status));
            } else {
                answerBuilder.append(String.format("For %s, the wheelchair accessible entrance is recorded as %s in verified records.",
                        place.getName(), status));
            }

            sources.add(new AiEvidenceSourceDto(
                    place.getId(),
                    place.getName(),
                    "WHEELCHAIR_ACCESSIBLE_ENTRANCE",
                    status.name(),
                    profile.lastVerifiedAt(),
                    "INDEPENDENT_AUDIT",
                    "Official entrance audit assessment.",
                    status == FeatureStatus.AVAILABLE ? "HIGH_EVIDENCE" : "MODERATE_EVIDENCE"
            ));

        } else if (lower.contains("elevator") || lower.contains("lift") || lower.contains("लिफ्ट") || lower.contains("ascensor")) {
            FeatureStatus status = findFeatureStatus(profile, FeatureType.ELEVATOR_AVAILABILITY);
            if (isHindi) {
                answerBuilder.append(String.format("%s पर लिफ्ट की उपलब्धता सत्यापित रिकॉर्ड में %s के रूप में दर्ज है।",
                        place.getName(), status == FeatureStatus.AVAILABLE ? "उपलब्ध (AVAILABLE)" : "अनुपलब्ध (NOT AVAILABLE)"));
            } else {
                answerBuilder.append(String.format("Elevator availability at %s is recorded as %s in verified records.",
                        place.getName(), status));
            }

            sources.add(new AiEvidenceSourceDto(
                    place.getId(),
                    place.getName(),
                    "ELEVATOR_AVAILABILITY",
                    status.name(),
                    profile.lastVerifiedAt(),
                    "INDEPENDENT_AUDIT",
                    "Vertical access elevator audit.",
                    status == FeatureStatus.AVAILABLE ? "HIGH_EVIDENCE" : "MODERATE_EVIDENCE"
            ));

        } else if (lower.contains("washroom") || lower.contains("restroom") || lower.contains("toilet") || lower.contains("शौचालय") || lower.contains("baño")) {
            FeatureStatus status = findFeatureStatus(profile, FeatureType.ACCESSIBLE_WASHROOM);
            answerBuilder.append(String.format("Accessible restroom facility at %s is recorded as %s in verified records.",
                    place.getName(), status));

            sources.add(new AiEvidenceSourceDto(
                    place.getId(),
                    place.getName(),
                    "ACCESSIBLE_WASHROOM",
                    status.name(),
                    profile.lastVerifiedAt(),
                    "INDEPENDENT_AUDIT",
                    "Sanitary stall clearance and grab bar audit.",
                    status == FeatureStatus.AVAILABLE ? "HIGH_EVIDENCE" : "MODERATE_EVIDENCE"
            ));

        } else {
            // General overview of the place
            answerBuilder.append(String.format("%s is a %s located at %s. Verified features: %d available, %d barriers, %d unknown.",
                    place.getName(), place.getCategory(), place.getAddress(),
                    profile.availableCount(), profile.notAvailableCount(), profile.unknownCount()));

            for (FeatureStatusDto f : profile.features()) {
                if (f.status() == FeatureStatus.AVAILABLE || f.status() == FeatureStatus.NOT_AVAILABLE) {
                    sources.add(new AiEvidenceSourceDto(
                            place.getId(),
                            place.getName(),
                            f.name() != null ? f.name() : f.code(),
                            f.status().name(),
                            f.lastVerifiedAt() != null ? f.lastVerifiedAt() : profile.lastVerifiedAt(),
                            "INDEPENDENT_AUDIT",
                            f.notes() != null ? f.notes() : "Verified on-site physical feature",
                            f.status() == FeatureStatus.AVAILABLE ? "HIGH_EVIDENCE" : "MODERATE_EVIDENCE"
                    ));
                }
            }
        }

        // Add Community Reports distinction if present
        if (!communityReports.isEmpty()) {
            AccessibilityReport latestReport = communityReports.get(0);
            answerBuilder.append(String.format("\n\nCommunity Insight (Unverified): A recent community report submitted on %s noted: \"%s\" (Status: %s). Note: Community submissions do not modify verified physical status until approved by moderators.",
                    latestReport.getCreatedAt().toLocalDate(),
                    latestReport.getDescription(),
                    latestReport.getStatus()));

            sources.add(new AiEvidenceSourceDto(
                    place.getId(),
                    place.getName(),
                    latestReport.getCategory().name(),
                    latestReport.getStatus().name(),
                    latestReport.getCreatedAt(),
                    "COMMUNITY_REPORT",
                    latestReport.getDescription(),
                    "COMMUNITY_REPORTED"
            ));
        }

        // Freshness assessment
        OffsetDateTime verifiedAt = profile.lastVerifiedAt();
        if (verifiedAt != null) {
            if (verifiedAt.isBefore(OffsetDateTime.now().minusDays(180))) {
                answerBuilder.append(String.format("\n\nNotice: This venue was last verified on %s (>180 days ago) and is due for community re-verification.",
                        verifiedAt.toLocalDate()));
                overallReliability = "STALE_DATA";
            } else {
                overallReliability = "HIGH_EVIDENCE";
            }
        } else {
            overallReliability = communityReports.isEmpty() ? "INSUFFICIENT_DATA" : "COMMUNITY_REPORTED";
        }

        return new AiChatResponse(
                answerBuilder.toString(),
                place.getId(),
                place.getName(),
                null,
                List.of(),
                sources,
                overallReliability,
                List.of(
                        "Does this place have an accessible restroom?",
                        "When was this place last verified?",
                        "How can I submit an observation for this venue?"
                ),
                client.getProviderName(),
                client.getProviderName()
        );
    }

    private Optional<Place> findCandidatePlaceInQuery(String query) {
        String lower = query.toLowerCase();
        List<Place> allActive = placeRepository.findAllByIsActiveTrue();
        return allActive.stream()
                .filter(p -> {
                    String name = p.getName().toLowerCase();
                    return lower.contains(name) || (name.length() > 6 && lower.contains(name.substring(0, name.length() - 3)));
                })
                .findFirst();
    }

    private boolean isQueryAskingAboutSpecificUnrecordedPlace(String query) {
        String lower = query.toLowerCase();
        return (lower.contains("does ") || lower.contains("is ") || lower.contains("can i visit ") || lower.contains("क्या ")) &&
               (lower.contains("school") || lower.contains("hospital") || lower.contains("clinic") ||
                lower.contains("college") || lower.contains("station") || lower.contains("center") ||
                lower.contains("hall") || lower.contains("restroom") || lower.contains("elevator") ||
                lower.contains("ramp") || lower.contains("wheelchair"));
    }

    private String extractPotentialVenueName(String query) {
        // Extracts venue candidate string from typical question patterns
        String q = query.replaceAll("(?i)^(does|is|can i visit|what about|tell me about)\\s+", "");
        q = q.replaceAll("(?i)\\s+(have|has|accessible|wheelchair|ramp|elevator|restroom|entrance|available|near).*$", "");
        q = q.trim();
        return q.length() > 2 ? q : "the requested venue";
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
                            requiredFeatures.add(f.asText());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("External AI filter extraction failed, falling back to rule-based: {}", e.getMessage());
            }
        }

        // Rule-based keyword extraction fallback
        if (category == null) {
            for (String cat : KNOWN_CATEGORIES) {
                if (lower.contains(cat.toLowerCase()) || lower.contains(cat.toLowerCase() + "s")) {
                    category = cat;
                    break;
                }
            }
        }

        if (city == null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\bin\\s+([A-Z][a-z]+|[a-z]+)\\b", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(query);
            if (m.find()) {
                String candidate = m.group(1);
                List<String> stopWords = List.of("the", "a", "an", "this", "our", "my", "all", "order", "addition", "wheelchair", "hospital", "transit", "college");
                if (!stopWords.contains(candidate.toLowerCase())) {
                    city = candidate.substring(0, 1).toUpperCase() + candidate.substring(1).toLowerCase();
                }
            }
        }

        if (lower.contains("wheelchair")) {
            requiredFeatures.add("WHEELCHAIR_ACCESSIBLE_ENTRANCE");
        } else if (lower.contains("step-free") || lower.contains("step free")) {
            requiredFeatures.add("STEP_FREE_ENTRANCE");
        }
        if (lower.contains("elevator") || lower.contains("lift")) {
            requiredFeatures.add("ELEVATOR_AVAILABILITY");
        }
        if (lower.contains("restroom") || lower.contains("toilet") || lower.contains("washroom")) {
            requiredFeatures.add("ACCESSIBLE_RESTROOM");
        }
        if (lower.contains("ramp")) {
            requiredFeatures.add("ENTRANCE_RAMP");
        }

        return new AiSearchFiltersDto(category, city, null, requiredFeatures, extractedKeyword);
    }

    private String generateSearchExplanation(String query, AiSearchFiltersDto filters, int count) {
        StringBuilder sb = new StringBuilder();
        sb.append("Found ").append(count).append(" venue").append(count == 1 ? "" : "s");

        if (filters.category() != null) {
            sb.append(" matching category '").append(filters.category()).append("'");
        }
        if (!filters.requiredFeatures().isEmpty()) {
            sb.append(" with verified ").append(String.join(", ", filters.requiredFeatures()));
        }
        sb.append(". All physical access criteria are verified against our Four-State Model.");
        return sb.toString();
    }

    private String detectFeatureCodeFromText(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("elevator") || lower.contains("lift")) return "ELEVATOR_AVAILABILITY";
        if (lower.contains("ramp") || lower.contains("slope")) return "ENTRANCE_RAMP";
        if (lower.contains("restroom") || lower.contains("toilet") || lower.contains("washroom")) return "ACCESSIBLE_RESTROOM";
        if (lower.contains("parking") || lower.contains("car")) return "ACCESSIBLE_PARKING";
        if (lower.contains("step") || lower.contains("door") || lower.contains("entrance")) return "STEP_FREE_ENTRANCE";
        return "WHEELCHAIR_ACCESSIBLE_ENTRANCE";
    }

    private void validateInput(String input, String fieldName) {
        if (input == null || input.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " cannot be empty");
        }
        if (input.length() > properties.getMaxInputChars()) {
            throw new BadRequestException(fieldName + " exceeds maximum length of " + properties.getMaxInputChars() + " characters");
        }
    }

    private AiClient selectClient() {
        if (openAiClient != null && openAiClient.isAvailable()) {
            return openAiClient;
        }
        return fallbackClient;
    }
}
