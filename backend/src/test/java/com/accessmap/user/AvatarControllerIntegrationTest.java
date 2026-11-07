package com.accessmap.user;

import com.accessmap.config.JwtService;
import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import com.accessmap.repository.MediaFileRepository;
import com.accessmap.repository.UserRepository;
import com.accessmap.service.MediaStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AvatarControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired MediaFileRepository mediaFileRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    @MockBean
    MediaStorageService mediaStorageService;

    private User testUser;
    private String userToken;

    @BeforeEach
    void setUp() {
        mediaFileRepository.deleteAll();
        userRepository.deleteAll();

        testUser = User.builder()
                .email("avataruser@accessmap.local")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Avatar Test User")
                .role(UserRole.ROLE_USER)
                .isEnabled(true)
                .build();
        testUser = userRepository.save(testUser);
        userToken = "Bearer " + jwtService.generateToken(testUser);
    }

    @Test
    @DisplayName("GET /api/v1/users/me/avatar without auth returns 401")
    void getAvatar_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/avatar"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("GET /api/v1/users/me/avatar when user has no avatar returns 404")
    void getAvatar_notFound() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/avatar")
                        .header("Authorization", userToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("DELETE /api/v1/users/me/avatar without auth returns 401")
    void deleteAvatar_unauthorized() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me/avatar"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DELETE /api/v1/users/me/avatar when no avatar exists returns 404")
    void deleteAvatar_notFound() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me/avatar")
                        .header("Authorization", userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/v1/users/me/avatar uploads avatar successfully")
    void uploadAvatar_success() throws Exception {
        byte[] fakePngBytes = new byte[] { (byte)0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A };
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                fakePngBytes
        );

        when(mediaStorageService.uploadAvatar(any())).thenReturn(
                new MediaStorageService.UploadResult(
                        "avatars/" + UUID.randomUUID() + ".webp",
                        "accessmap-media",
                        "image/webp",
                        1024L,
                        "sha256fakehash"
                )
        );
        when(mediaStorageService.generatePresignedGetUrl(any())).thenReturn(
                "http://localhost:9000/accessmap-media/avatars/test.webp?token=sig"
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(file)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").isNotEmpty())
                .andExpect(jsonPath("$.data.mimeType").value("image/webp"))
                .andExpect(jsonPath("$.data.fileSizeBytes").value(1024));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me/avatar with invalid file format returns 422")
    void uploadAvatar_invalidFormat() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "not an image".getBytes()
        );

        when(mediaStorageService.uploadAvatar(any())).thenThrow(
                new MediaStorageService.MediaUploadException("Unsupported image format 'text/plain'. Allowed: JPEG, PNG, WebP.")
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(file)
                        .with(request -> { request.setMethod("PUT"); return request; })
                        .header("Authorization", userToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UPLOAD_ERROR"));
    }
}

