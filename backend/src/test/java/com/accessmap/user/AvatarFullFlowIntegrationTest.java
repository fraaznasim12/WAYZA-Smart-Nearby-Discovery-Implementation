package com.accessmap.user;

import com.accessmap.config.JwtService;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.repository.MediaFileRepository;
import com.accessmap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration test verifying the complete profile photo lifecycle
 * with real MediaStorageService (using local filesystem storage under test profile).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AvatarFullFlowIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private MediaFileRepository mediaFileRepository;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    // Minimal valid 1x1 PNG image
    private static final byte[] VALID_PNG_BYTES = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    );

    private User user1;
    private User user2;
    private String token1;
    private String token2;

    @BeforeEach
    void setUp() {
        mediaFileRepository.deleteAll();
        userRepository.deleteAll();

        user1 = userRepository.save(User.builder()
                .email("user1@accessmap.local")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("User One")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());
        token1 = "Bearer " + jwtService.generateToken(user1);

        user2 = userRepository.save(User.builder()
                .email("user2@accessmap.local")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("User Two")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build());
        token2 = "Bearer " + jwtService.generateToken(user2);
    }

    @Test
    @DisplayName("Complete Lifecycle: Upload -> Verify Endpoint -> Media Delivery -> Persistence in /me -> Delete")
    void fullAvatarLifecycle_success() throws Exception {
        MockMultipartFile validFile = new MockMultipartFile(
                "file",
                "profile.png",
                MediaType.IMAGE_PNG_VALUE,
                VALID_PNG_BYTES
        );

        // 1. Upload Avatar
        MvcResult uploadResult = mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(validFile)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .header("Authorization", token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value(startsWith("/api/v1/media/avatars/")))
                .andExpect(jsonPath("$.data.mimeType").value("image/png"))
                .andExpect(jsonPath("$.data.fileSizeBytes").value(greaterThan(0)))
                .andReturn();

        String responseBody = uploadResult.getResponse().getContentAsString();
        // Extract avatarUrl from JSON response
        int urlStart = responseBody.indexOf("\"avatarUrl\":\"") + 13;
        int urlEnd = responseBody.indexOf("\"", urlStart);
        String avatarUrl = responseBody.substring(urlStart, urlEnd);

        // 2. Fetch avatar metadata via GET /api/v1/users/me/avatar
        mockMvc.perform(get("/api/v1/users/me/avatar")
                        .header("Authorization", token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value(avatarUrl));

        // 3. Verify user profile endpoint /api/v1/auth/me includes avatarUrl
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value(avatarUrl));

        // 4. Verify public media delivery endpoint streams the actual image bytes
        mockMvc.perform(get(avatarUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string("Cache-Control", containsString("max-age=3600")));

        // 5. Delete avatar
        mockMvc.perform(delete("/api/v1/users/me/avatar")
                        .header("Authorization", token1))
                .andExpect(status().isNoContent());

        // 6. Confirm avatar is now removed
        mockMvc.perform(get("/api/v1/users/me/avatar")
                        .header("Authorization", token1))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").doesNotExist());
    }

    @Test
    @DisplayName("Validation: Unsupported MIME type (text/plain) returns 422 UPLOAD_ERROR")
    void uploadAvatar_unsupportedMime_returns422() throws Exception {
        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "notes.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "Hello world, not an image".getBytes()
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(textFile)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .header("Authorization", token1))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UPLOAD_ERROR"))
                .andExpect(jsonPath("$.error.message").value(containsString("Unsupported image format")));
    }

    @Test
    @DisplayName("Validation: Empty file upload returns 422 UPLOAD_ERROR")
    void uploadAvatar_emptyFile_returns422() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[0]
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(emptyFile)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .header("Authorization", token1))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UPLOAD_ERROR"))
                .andExpect(jsonPath("$.error.message").value("No file was provided."));
    }

    @Test
    @DisplayName("Ownership Isolation: User2 cannot access or delete User1's avatar")
    void ownershipIsolation_userCannotMutateOtherUserAvatar() throws Exception {
        MockMultipartFile validFile = new MockMultipartFile(
                "file",
                "profile.png",
                MediaType.IMAGE_PNG_VALUE,
                VALID_PNG_BYTES
        );

        // User1 uploads avatar
        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(validFile)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .header("Authorization", token1))
                .andExpect(status().isOk());

        // User2 checks their own avatar -> should be 404 Not Found
        mockMvc.perform(get("/api/v1/users/me/avatar")
                        .header("Authorization", token2))
                .andExpect(status().isNotFound());

        // User2 tries to delete avatar -> should be 404 Not Found
        mockMvc.perform(delete("/api/v1/users/me/avatar")
                        .header("Authorization", token2))
                .andExpect(status().isNotFound());

        // User1's avatar must still exist and be intact
        mockMvc.perform(get("/api/v1/users/me/avatar")
                        .header("Authorization", token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value(startsWith("/api/v1/media/avatars/")));
    }
}

