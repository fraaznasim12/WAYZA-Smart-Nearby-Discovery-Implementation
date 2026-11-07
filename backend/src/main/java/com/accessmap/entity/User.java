package com.accessmap.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * JPA Entity representing an AccessMap registered user.
 *
 * <p>Implements {@link UserDetails} so Spring Security can directly use this entity
 * as the principal in the security context — no separate UserDetailsService wrapper needed.
 *
 * <p>Role-Based Access Control (RBAC) is enforced via the {@link UserRole} enum,
 * mapped as a VARCHAR column with a database CHECK constraint.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private UserRole role = UserRole.ROLE_USER;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    /**
     * Object key of the user's current profile photo within the storage bucket.
     * Null when no avatar has been uploaded.
     * Example: {@code "avatars/550e8400-e29b-41d4-a716-446655440000.webp"}
     */
    @Column(name = "avatar_object_key", length = 500)
    private String avatarObjectKey;

    /**
     * FK to the media_files record for the current avatar.
     * Null when no avatar has been uploaded.
     * Lazy-loaded to avoid joins on every principal resolution.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_media_id")
    private MediaFile avatarMedia;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // -------------------------------------------------------------------------
    // Spring Security UserDetails contract implementation
    // -------------------------------------------------------------------------

    /**
     * Returns the granted authority matching the user's single RBAC role.
     * Example: {@code ROLE_CONTRIBUTOR} maps to {@code SimpleGrantedAuthority("ROLE_CONTRIBUTOR")}.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    /** Returns the BCrypt-hashed password stored in the database. */
    @Override
    public String getPassword() {
        return passwordHash;
    }

    /** Returns the user's email address as the unique authentication username. */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return Boolean.TRUE.equals(isEnabled); }
}

