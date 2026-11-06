package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.AuthResponse;
import com.accessmap.dto.LoginRequest;
import com.accessmap.dto.RegisterRequest;
import com.accessmap.dto.UserProfileResponse;
import com.accessmap.entity.User;
import com.accessmap.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller exposing user registration, authentication, and profile endpoints.
 *
 * <p>All endpoints under /api/v1/auth/register and /api/v1/auth/login are public.
 * GET /api/v1/auth/me requires a valid JWT Bearer token.
 * Logout is handled client-side by discarding the token (stateless JWT design).
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     *
     * <p>Registers a new user account. The role is always ROLE_USER.
     * Callers cannot choose their own role.
     *
     * @param req validated registration payload (email, password, fullName)
     * @return 201 Created with JWT token and user profile
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponse response = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * POST /api/v1/auth/login
     *
     * <p>Authenticates a user with email + password, returns a signed JWT access token.
     *
     * @param req validated login payload (email, password)
     * @return 200 OK with JWT token and user profile
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/v1/auth/me
     *
     * <p>Returns the profile of the currently authenticated user.
     * Requires a valid JWT Bearer token in the Authorization header.
     * Only the owner's own data is ever returned — no cross-user access is possible.
     *
     * <p>Logout note: Since JWT is stateless, logout is handled client-side by
     * deleting the token from storage. The server has no session to invalidate.
     *
     * @param currentUser injected by Spring Security from the validated JWT
     * @return 200 OK with user profile (id, email, fullName, role, memberSince)
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal User currentUser) {
        UserProfileResponse profile = authService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }
}

