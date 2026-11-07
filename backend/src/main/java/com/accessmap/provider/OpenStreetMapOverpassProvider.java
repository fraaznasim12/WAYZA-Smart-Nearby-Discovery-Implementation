package com.accessmap.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@link PlaceDataProvider} implementation backed by the OpenStreetMap Overpass API.
 *
 * <h3>Design Guarantees</h3>
 * <ul>
 *   <li>All exceptions are caught; callers always receive a (possibly empty) list.</li>
 *   <li>Requests include a proper {@code User-Agent} header per OSM usage policy.</li>
 *   <li>Rate limiting enforces a configurable minimum delay between requests.</li>
 *   <li>Results are cached in-memory with a configurable TTL to avoid redundant round-trips.</li>
 *   <li>Up to 2 retries with exponential backoff on transient failures.</li>
 *   <li>Can be disabled entirely via {@code accessmap.osm.enabled=false}.</li>
 * </ul>
 *
 * <h3>Attribution</h3>
 * OSM data is licensed under the Open Database License (ODbL).
 * © OpenStreetMap contributors – https://www.openstreetmap.org/copyright
 */
@Component
@Slf4j
public class OpenStreetMapOverpassProvider implements PlaceDataProvider {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    @Value("${accessmap.osm.overpass-endpoint:https://overpass-api.de/api/interpreter}")
    private String overpassEndpoint;

    @Value("${accessmap.osm.enabled:true}")
    private boolean osmEnabled;

    @Value("${accessmap.osm.timeout-seconds:15}")
    private int timeoutSeconds;

    @Value("${accessmap.osm.rate-limit-ms:1000}")
    private long rateLimitMs;

    @Value("${accessmap.osm.cache-ttl-minutes:10}")
    private long cacheTtlMinutes;

    @Value("${accessmap.osm.max-retries:2}")
    private int maxRetries;

    // -------------------------------------------------------------------------
    // Internal State
    // -------------------------------------------------------------------------

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /** Simple in-memory cache: cacheKey → (timestamp, results). */
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private volatile long lastRequestTimestamp = 0L;

    // -------------------------------------------------------------------------
    // OSM Tag → AccessMap Category Mapping
    // -------------------------------------------------------------------------

    private static final Map<String, String> AMENITY_TO_CATEGORY = Map.ofEntries(
            Map.entry("hospital", "HOSPITAL"),
            Map.entry("clinic", "CLINIC"),
            Map.entry("doctors", "DOCTORS"),
            Map.entry("medical_centre", "MEDICAL_CENTRE"),
            Map.entry("diagnostics_centre", "DIAGNOSTIC_CENTRE"),
            Map.entry("college", "COLLEGE"),
            Map.entry("university", "UNIVERSITY"),
            Map.entry("school", "SCHOOL"),
            Map.entry("library", "LIBRARY"),
            Map.entry("bus_station", "BUS_STATION"),
            Map.entry("restaurant", "RESTAURANT"),
            Map.entry("cafe", "CAFE"),
            Map.entry("hotel", "HOTEL"),
            Map.entry("marketplace", "MARKET"),
            Map.entry("townhall", "PUBLIC_OFFICE"),
            Map.entry("government", "PUBLIC_OFFICE"),
            Map.entry("community_centre", "COMMUNITY_CENTRE"),
            Map.entry("public_building", "PUBLIC_BUILDING")
    );

    private static final Map<String, String> TOURISM_TO_CATEGORY = Map.of(
            "hotel", "HOTEL"
    );

    private static final Map<String, String> SHOP_TO_CATEGORY = Map.of(
            "mall", "SHOPPING_MALL",
            "supermarket", "SUPERMARKET"
    );

    private static final Map<String, String> LEISURE_TO_CATEGORY = Map.of(
            "park", "PARK"
    );

    private static final Map<String, String> RAILWAY_TO_CATEGORY = Map.of(
            "station", "RAILWAY_STATION"
    );

    private static final Map<String, String> AEROWAY_TO_CATEGORY = Map.of(
            "terminal", "AIRPORT",
            "aerodrome", "AIRPORT"
    );

    private static final Map<String, String> HEALTHCARE_TO_CATEGORY = Map.of(
            "centre", "MEDICAL_CENTRE",
            "hospital", "HOSPITAL",
            "clinic", "CLINIC"
    );

    // -------------------------------------------------------------------------
    // PlaceDataProvider Implementation
    // -------------------------------------------------------------------------

    @Override
    public String getProviderName() {
        return "OpenStreetMap Overpass API";
    }

    @Override
    public boolean isAvailable() {
        if (!osmEnabled) return false;
        // Lightweight check — just verify the endpoint can be reached
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(overpassEndpoint + "?data=[out:json];out%200;"))
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "AccessMap-Platform/1.0 (contact@accessmap.local)")
                    .GET()
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return resp.statusCode() == 200;
        } catch (Exception e) {
            log.debug("OSM Overpass availability check failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public List<OsmPlace> searchByBoundingBox(
            double south, double west, double north, double east,
            List<String> categories) {

        if (!osmEnabled) {
            log.info("OSM provider is disabled (accessmap.osm.enabled=false). Returning empty list.");
            return List.of();
        }

        String cacheKey = buildCacheKey(south, west, north, east, categories);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired(cacheTtlMinutes)) {
            log.debug("OSM cache hit for key: {}", cacheKey);
            return cached.results();
        }

        String query = buildOverpassQuery(south, west, north, east, categories);
        List<OsmPlace> results = executeWithRetry(query, 0);

        cache.put(cacheKey, new CacheEntry(System.currentTimeMillis(), results));
        log.info("OSM Overpass returned {} places for bbox [{},{},{},{}]", results.size(), south, west, north, east);
        return results;
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    private List<OsmPlace> executeWithRetry(String query, int attempt) {
        enforceRateLimit();

        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = overpassEndpoint + "?data=" + encodedQuery;

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("User-Agent", "AccessMap-Platform/1.0 (contact@accessmap.local)")
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            lastRequestTimestamp = System.currentTimeMillis();
            HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("OSM Overpass returned HTTP {}: {}", response.statusCode(),
                        response.body().length() > 200 ? response.body().substring(0, 200) : response.body());
                return retryOrEmpty(query, attempt, "HTTP " + response.statusCode());
            }

            return parseOverpassResponse(response.body());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("OSM Overpass request interrupted on attempt {}: {}", attempt, e.getMessage());
            return List.of();
        } catch (Exception e) {
            log.warn("OSM Overpass request failed on attempt {}: {}", attempt, e.getMessage());
            return retryOrEmpty(query, attempt, e.getMessage());
        }
    }

    private List<OsmPlace> retryOrEmpty(String query, int attempt, String reason) {
        if (attempt < maxRetries) {
            long backoffMs = (long) Math.pow(2, attempt) * 2000L;
            log.info("Retrying OSM Overpass in {}ms (attempt {}/{}). Reason: {}", backoffMs, attempt + 1, maxRetries, reason);
            try {
                Thread.sleep(backoffMs);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return List.of();
            }
            return executeWithRetry(query, attempt + 1);
        }
        log.warn("OSM Overpass: all {} retries exhausted. Returning empty list. Reason: {}", maxRetries, reason);
        return List.of();
    }

    private void enforceRateLimit() {
        long elapsed = System.currentTimeMillis() - lastRequestTimestamp;
        if (elapsed < rateLimitMs) {
            try {
                Thread.sleep(rateLimitMs - elapsed);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Builds an Overpass QL query that retrieves nodes and ways matching common
     * accessibility-relevant OSM tags within the given bounding box.
     */
    private String buildOverpassQuery(double south, double west, double north, double east, List<String> categories) {
        // If no specific categories provided, fetch all supported types
        String bbox = south + "," + west + "," + north + "," + east;
        StringBuilder sb = new StringBuilder();
        sb.append("[out:json][timeout:").append(timeoutSeconds).append("];(");

        // Healthcare
        sb.append("node[\"amenity\"~\"hospital|clinic|doctors|medical_centre|diagnostics_centre\"](").append(bbox).append(");");
        sb.append("way[\"amenity\"~\"hospital|clinic|doctors|medical_centre|diagnostics_centre\"](").append(bbox).append(");");
        sb.append("node[\"healthcare\"](").append(bbox).append(");");

        // Education
        sb.append("node[\"amenity\"~\"college|university|school|library\"](").append(bbox).append(");");
        sb.append("way[\"amenity\"~\"college|university|school|library\"](").append(bbox).append(");");

        // Transport
        sb.append("node[\"railway\"=\"station\"](").append(bbox).append(");");
        sb.append("node[\"amenity\"=\"bus_station\"](").append(bbox).append(");");
        sb.append("way[\"amenity\"=\"bus_station\"](").append(bbox).append(");");
        sb.append("node[\"aeroway\"~\"terminal|aerodrome\"](").append(bbox).append(");");
        sb.append("way[\"aeroway\"~\"terminal|aerodrome\"](").append(bbox).append(");");

        // Food & Hospitality
        sb.append("node[\"amenity\"~\"restaurant|cafe\"](").append(bbox).append(");");
        sb.append("node[\"tourism\"=\"hotel\"](").append(bbox).append(");");
        sb.append("way[\"tourism\"=\"hotel\"](").append(bbox).append(");");

        // Shopping
        sb.append("node[\"shop\"~\"mall|supermarket|marketplace\"](").append(bbox).append(");");
        sb.append("way[\"shop\"~\"mall|supermarket|marketplace\"](").append(bbox).append(");");

        // Public Facilities
        sb.append("node[\"leisure\"=\"park\"](").append(bbox).append(");");
        sb.append("way[\"leisure\"=\"park\"](").append(bbox).append(");");
        sb.append("node[\"amenity\"~\"townhall|community_centre\"](").append(bbox).append(");");
        sb.append("way[\"amenity\"~\"townhall|community_centre\"](").append(bbox).append(");");

        sb.append(");out center tags;");
        return sb.toString();
    }

    private List<OsmPlace> parseOverpassResponse(String json) {
        List<OsmPlace> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode elements = root.path("elements");
            if (!elements.isArray()) {
                log.warn("OSM Overpass response has no 'elements' array");
                return List.of();
            }

            for (JsonNode el : elements) {
                try {
                    OsmPlace place = parseElement(el);
                    if (place != null) {
                        results.add(place);
                    }
                } catch (Exception e) {
                    log.debug("Skipping unparseable OSM element: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse OSM Overpass JSON response: {}", e.getMessage());
        }
        return results;
    }

    private OsmPlace parseElement(JsonNode el) {
        String type = el.path("type").asText();
        long osmId = el.path("id").asLong();
        JsonNode tags = el.path("tags");

        if (tags.isMissingNode() || tags.isEmpty()) return null;

        String name = tags.path("name").asText(null);
        if (name == null || name.isBlank()) return null;

        // Determine coordinates — nodes have lat/lon directly; ways have "center"
        double lat, lng;
        if ("node".equals(type)) {
            lat = el.path("lat").asDouble(Double.NaN);
            lng = el.path("lon").asDouble(Double.NaN);
        } else {
            JsonNode center = el.path("center");
            lat = center.path("lat").asDouble(Double.NaN);
            lng = center.path("lon").asDouble(Double.NaN);
        }
        if (Double.isNaN(lat) || Double.isNaN(lng)) return null;

        String category = resolveCategory(tags);
        if (category == null) return null;

        String externalId = "osm:" + type + ":" + osmId;
        String address = buildAddress(tags);
        String city = tags.path("addr:city").asText(null);
        String state = tags.path("addr:state").asText(null);
        String postalCode = tags.path("addr:postcode").asText(null);
        String country = tags.path("addr:country").asText("India");
        String phone = tags.path("phone").asText(tags.path("contact:phone").asText(null));
        String website = tags.path("website").asText(tags.path("contact:website").asText(null));
        String description = tags.path("description").asText(tags.path("note").asText(null));

        return new OsmPlace(externalId, name, category, lat, lng,
                address, city, state, postalCode, country,
                blankToNull(phone), blankToNull(website), blankToNull(description));
    }

    private String resolveCategory(JsonNode tags) {
        // Check amenity first (most common)
        String amenity = tags.path("amenity").asText(null);
        if (amenity != null) {
            String cat = AMENITY_TO_CATEGORY.get(amenity);
            if (cat != null) return cat;
        }

        // Railway
        String railway = tags.path("railway").asText(null);
        if (railway != null) {
            // Check for metro/subway
            String subwayTag = tags.path("subway").asText("no");
            String stationTag = tags.path("station").asText(null);
            if ("yes".equals(subwayTag) || "subway".equals(stationTag)) {
                return "METRO_STATION";
            }
            String cat = RAILWAY_TO_CATEGORY.get(railway);
            if (cat != null) return cat;
        }

        // Tourism
        String tourism = tags.path("tourism").asText(null);
        if (tourism != null) {
            String cat = TOURISM_TO_CATEGORY.get(tourism);
            if (cat != null) return cat;
        }

        // Shop
        String shop = tags.path("shop").asText(null);
        if (shop != null) {
            String cat = SHOP_TO_CATEGORY.get(shop);
            if (cat != null) return cat;
        }

        // Leisure
        String leisure = tags.path("leisure").asText(null);
        if (leisure != null) {
            String cat = LEISURE_TO_CATEGORY.get(leisure);
            if (cat != null) return cat;
        }

        // Aeroway
        String aeroway = tags.path("aeroway").asText(null);
        if (aeroway != null) {
            String cat = AEROWAY_TO_CATEGORY.get(aeroway);
            if (cat != null) return cat;
        }

        // Healthcare tag
        String healthcare = tags.path("healthcare").asText(null);
        if (healthcare != null) {
            String cat = HEALTHCARE_TO_CATEGORY.get(healthcare);
            return cat != null ? cat : "MEDICAL_CENTRE";
        }

        return null;
    }

    private String buildAddress(JsonNode tags) {
        StringBuilder addr = new StringBuilder();
        appendIfPresent(addr, tags, "addr:housenumber");
        appendIfPresent(addr, tags, "addr:street");
        appendIfPresent(addr, tags, "addr:suburb");
        return addr.length() > 0 ? addr.toString().trim() : null;
    }

    private void appendIfPresent(StringBuilder sb, JsonNode tags, String key) {
        String val = tags.path(key).asText(null);
        if (val != null && !val.isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(val);
        }
    }

    private String blankToNull(String s) {
        return (s != null && !s.isBlank()) ? s : null;
    }

    private String buildCacheKey(double south, double west, double north, double east, List<String> categories) {
        // Round to 2 decimal places to increase cache hits for nearby queries
        return String.format("%.2f_%.2f_%.2f_%.2f_%s", south, west, north, east,
                categories == null ? "all" : String.join(",", categories));
    }

    // -------------------------------------------------------------------------
    // Cache Entry
    // -------------------------------------------------------------------------

    private record CacheEntry(long timestamp, List<OsmPlace> results) {
        boolean isExpired(long ttlMinutes) {
            return (System.currentTimeMillis() - timestamp) > ttlMinutes * 60_000L;
        }
    }
}
