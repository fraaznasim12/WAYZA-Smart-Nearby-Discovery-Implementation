package com.accessmap.service;

import com.accessmap.config.JwtService;
import com.accessmap.dto.AuthResponse;
import com.accessmap.dto.LoginRequest;
import com.accessmap.dto.RegisterRequest;
import com.accessmap.dto.UserProfileResponse;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.exception.BadRequestException;
import com.accessmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service managing user registration and stateless JWT authentication.
 *
 * <p>Security notes:
 * <ul>
 *   <li>All public registrations receive {@link UserRole#ROLE_USER} — no caller-supplied role accepted.</li>
 *   <li>Passwords are BCrypt-hashed before database storage; raw passwords are never logged.</li>
 *   <li>Email addresses are always normalized (trimmed, lowercased) before lookup or storage.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AvatarService avatarService;

    /**
     * Registers a new user account with {@link UserRole#ROLE_USER}.
     *
     * <p>SECURITY: The role is always forced to ROLE_USER regardless of any caller input.
     * Privileged roles must be assigned by an administrator through a separate admin API.
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account already exists with that email address");
        }

        // SECURITY: Always assign ROLE_USER — never accept role from caller
        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName().trim())
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);

        return AuthResponse.of(token, saved.getId(), saved.getEmail(), saved.getFullName(), saved.getRole());
    }

    /**
     * Authenticates a user and returns a JWT access token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();

        // Spring Security authenticates credentials — throws BadCredentialsException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, req.password())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtService.generateToken(user);
        return AuthResponse.of(token, user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    /**
     * Returns the authenticated user's profile by their UUID.
     * Used by GET /api/v1/auth/me after the JWT filter sets the SecurityContext.
     * Includes a fresh pre-signed avatar URL when the user has an avatar.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Generate a fresh pre-signed avatar URL (null if no avatar)
        String avatarUrl = null;
        if (user.getAvatarObjectKey() != null) {
            try {
                var avatarResponse = avatarService.getAvatar(user);
                avatarUrl = avatarResponse != null ? avatarResponse.avatarUrl() : null;
            } catch (Exception e) {
                log.warn("Failed to generate avatar URL for user {}: {}", userId, e.getMessage());
            }
        }

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getCreatedAt(),
                avatarUrl
        );
    }
}

