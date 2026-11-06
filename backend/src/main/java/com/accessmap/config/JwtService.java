package com.accessmap.config;

import com.accessmap.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service for issuing, parsing, and validating JSON Web Tokens (JWT).
 *
 * <p>Algorithm: HMAC-SHA256 (HS256) — a symmetric signing algorithm using the
 * configured secret key. The secret must be at least 256 bits (32 bytes).
 *
 * <p>Claims embedded in every token:
 * <ul>
 *   <li>{@code sub} — user's email address (the Spring Security username)</li>
 *   <li>{@code userId} — user's UUID for fast profile lookups</li>
 *   <li>{@code role} — user's RBAC role (e.g. ROLE_USER, ROLE_ADMIN)</li>
 *   <li>{@code iat} — issued-at timestamp</li>
 *   <li>{@code exp} — expiration timestamp</li>
 * </ul>
 *
 * <p>SECURITY: JWT tokens are never logged. The signing key is read from
 * environment variable JWT_SECRET — never hardcoded.
 */
@Service
public class JwtService {

    @Value("${accessmap.jwt.secret}")
    private String secretKey;

    @Value("${accessmap.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /** Extracts the email (subject) from a JWT token. */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** Extracts a single typed claim from a JWT token using the given resolver function. */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Generates a signed JWT for the given user, embedding userId and role claims.
     *
     * @param userDetails must be a {@link User} to access userId and role
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        if (userDetails instanceof User user) {
            // Embed userId and role in the token for downstream use
            extraClaims.put("userId", user.getId().toString());
            extraClaims.put("role", user.getRole().name());
        }
        return generateToken(extraClaims, userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validates a token: checks the signature, expiration, and that the
     * subject matches the given UserDetails.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

