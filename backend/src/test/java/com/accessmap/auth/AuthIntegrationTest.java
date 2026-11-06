package com.accessmap.auth;

import com.accessmap.dto.AuthResponse;
import com.accessmap.dto.LoginRequest;
import com.accessmap.dto.RegisterRequest;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.exception.BadRequestException;
import com.accessmap.repository.UserRepository;
import com.accessmap.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the full authentication flow.
 *
 * <p>Uses the "test" Spring profile which activates application-test.yml:
 * H2 in-memory database with Flyway disabled and Hibernate creating the schema.
 *
 * <p>Each test method runs in a transaction that is rolled back after completion,
 * so tests are fully isolated with no database state leaking between them.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AuthService authService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String REGISTER_URL = "/api/v1/auth/register";
    private static final String LOGIN_URL    = "/api/v1/auth/login";
    private static final String ME_URL       = "/api/v1/auth/me";

    @BeforeEach
    void clean() {
        userRepository.deleteAll();
    }

    // =========================================================================
    // TEST 1: Successful registration
    // =========================================================================

    @Test
    @DisplayName("POST /register — successful registration returns 201 with JWT token")
    void register_success() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "alice@example.com", "SecurePass1!", "Alice Smith"
        );

        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.email").value("alice@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Alice Smith"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));
    }

    // =========================================================================
    // TEST 2: Duplicate email registration
    // =========================================================================

    @Test
    @DisplayName("POST /register — duplicate email returns 400 BAD_REQUEST")
    void register_duplicateEmail() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "bob@example.com", "SecurePass1!", "Bob Jones"
        );
        // Register once
        authService.register(req);

        // Try to register again with the same email
        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    // =========================================================================
    // TEST 3: Password hashing — plaintext NEVER stored
    // =========================================================================

    @Test
    @DisplayName("Registration — password is BCrypt-hashed, plaintext never stored")
    void register_passwordIsHashed() {
        RegisterRequest req = new RegisterRequest(
                "carol@example.com", "MyPlainPassword!", "Carol White"
        );
        authService.register(req);

        User saved = userRepository.findByEmail("carol@example.com").orElseThrow();

        // Password must NOT equal plaintext
        assertThat(saved.getPasswordHash()).isNotEqualTo("MyPlainPassword!");
        // Password must start with BCrypt prefix "$2a$" or "$2b$"
        assertThat(saved.getPasswordHash()).startsWith("$2");
        // BCrypt encoder must verify the plaintext matches the hash
        assertThat(passwordEncoder.matches("MyPlainPassword!", saved.getPasswordHash())).isTrue();
    }

    // =========================================================================
    // TEST 4: Successful login
    // =========================================================================

    @Test
    @DisplayName("POST /login — valid credentials return 200 with JWT token")
    void login_success() throws Exception {
        authService.register(new RegisterRequest(
                "dave@example.com", "Password123!", "Dave Brown"
        ));

        LoginRequest loginReq = new LoginRequest("dave@example.com", "Password123!");

        mockMvc.perform(post(LOGIN_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("dave@example.com"));
    }

    // =========================================================================
    // TEST 5: Invalid login credentials
    // =========================================================================

    @Test
    @DisplayName("POST /login — wrong password returns 401 INVALID_CREDENTIALS")
    void login_wrongPassword() throws Exception {
        authService.register(new RegisterRequest(
                "eve@example.com", "CorrectHorse1!", "Eve Green"
        ));

        LoginRequest loginReq = new LoginRequest("eve@example.com", "WrongPassword!");

        mockMvc.perform(post(LOGIN_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("POST /login — non-existent email returns 401 INVALID_CREDENTIALS")
    void login_nonExistentEmail() throws Exception {
        LoginRequest loginReq = new LoginRequest("nobody@example.com", "Password123!");

        mockMvc.perform(post(LOGIN_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    // =========================================================================
    // TEST 6: Valid JWT authentication — GET /me
    // =========================================================================

    @Test
    @DisplayName("GET /me — valid JWT returns 200 with user profile")
    void getMe_withValidToken() throws Exception {
        AuthResponse authResponse = authService.register(new RegisterRequest(
                "frank@example.com", "Password123!", "Frank Black"
        ));
        String token = authResponse.token();

        mockMvc.perform(get(ME_URL)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("frank@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Frank Black"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.memberSince").isNotEmpty());
    }

    // =========================================================================
    // TEST 7: Expired / invalid token
    // =========================================================================

    @Test
    @DisplayName("GET /me — invalid JWT token returns 401 UNAUTHORIZED")
    void getMe_withInvalidToken() throws Exception {
        mockMvc.perform(get(ME_URL)
                .header("Authorization", "Bearer this.is.not.a.valid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /me — missing Authorization header returns 401 UNAUTHORIZED")
    void getMe_withNoToken() throws Exception {
        mockMvc.perform(get(ME_URL))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // TEST 8: Unauthorized access to protected endpoints
    // =========================================================================

    @Test
    @DisplayName("POST /places — no token returns 401 UNAUTHORIZED")
    void protectedEndpoint_withNoToken() throws Exception {
        mockMvc.perform(post("/api/v1/places")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // TEST 9: Role-based access restrictions
    // =========================================================================

    @Test
    @DisplayName("GET /admin/** — ROLE_USER token returns 403 ACCESS_DENIED")
    void adminEndpoint_withUserRole() throws Exception {
        AuthResponse authResponse = authService.register(new RegisterRequest(
                "grace@example.com", "Password123!", "Grace Lee"
        ));
        // Grace is ROLE_USER, cannot access /admin
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + authResponse.token()))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // TEST 10: Public registration cannot assign privileged roles
    // =========================================================================

    @Test
    @DisplayName("Public registration always assigns ROLE_USER — cannot escalate privileges")
    void register_cannotAssignPrivilegedRole() {
        // The RegisterRequest no longer accepts a role field.
        // Even if someone sends a role, it's ignored. Force ROLE_USER every time.
        RegisterRequest req = new RegisterRequest(
                "hank@example.com", "Password123!", "Hank Ops"
        );
        AuthResponse response = authService.register(req);

        // Must always be ROLE_USER
        assertThat(response.role()).isEqualTo(UserRole.ROLE_USER);

        User saved = userRepository.findByEmail("hank@example.com").orElseThrow();
        assertThat(saved.getRole()).isEqualTo(UserRole.ROLE_USER);
    }

    // =========================================================================
    // TEST 11: Validation — missing/short password
    // =========================================================================

    @Test
    @DisplayName("POST /register — short password returns 400 VALIDATION_ERROR")
    void register_shortPassword() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "ivan@example.com", "short", "Ivan Popov"
        );

        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.password").isNotEmpty());
    }

    @Test
    @DisplayName("POST /register — invalid email format returns 400 VALIDATION_ERROR")
    void register_invalidEmail() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "not-an-email", "Password123!", "Jane Doe"
        );

        mockMvc.perform(post(REGISTER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.email").isNotEmpty());
    }

    // =========================================================================
    // TEST 12: Email normalization
    // =========================================================================

    @Test
    @DisplayName("Email is normalized — stored and authenticated with lowercase")
    void register_emailIsNormalized() throws Exception {
        // Register with mixed-case email
        authService.register(new RegisterRequest(
                "Julia@Example.COM", "Password123!", "Julia Child"
        ));

        // Must be stored as lowercase
        assertThat(userRepository.existsByEmail("julia@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("Julia@Example.COM")).isFalse();

        // Login with any case must still work
        LoginRequest loginReq = new LoginRequest("JULIA@example.com", "Password123!");
        mockMvc.perform(post(LOGIN_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // TEST 13: CORS Configuration
    // =========================================================================

    @Test
    @DisplayName("CORS — preflight request from allowed origin returns 200 and Access-Control-Allow-Origin")
    void cors_preflightAllowedOrigin() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options(LOGIN_URL)
                .header("Origin", "http://localhost:5174")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type,Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS — preflight request from untrusted origin does NOT return Access-Control-Allow-Origin")
    void cors_untrustedOrigin() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options(LOGIN_URL)
                .header("Origin", "http://evil-attacker.com")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type,Authorization"))
                .andExpect(status().isForbidden());
    }
}

