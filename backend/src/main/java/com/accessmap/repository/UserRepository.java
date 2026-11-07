package com.accessmap.repository;

import com.accessmap.entity.User;
import com.accessmap.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for {@link User} entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Looks up a user by their email address (the authentication username).
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks whether a user with the given email already exists.
     */
    boolean existsByEmail(String email);

    long countByIsEnabledTrue();

    long countByRole(UserRole role);

    long countByRoleAndIsEnabledTrue(UserRole role);

    java.util.List<User> findAllByRole(UserRole role);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isEnabled IS NULL OR u.isEnabled = :isEnabled) " +
           "ORDER BY u.createdAt DESC")
    Page<User> searchUsers(
            @Param("search") String search,
            @Param("role") UserRole role,
            @Param("isEnabled") Boolean isEnabled,
            Pageable pageable
    );
}
