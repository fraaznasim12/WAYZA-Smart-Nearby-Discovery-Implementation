-- =============================================================================
-- V4__update_user_roles.sql
-- AccessMap — Extend Users Role Check Constraint
--
-- Adds support for ROLE_BUSINESS_OWNER to the users table CHECK constraint
-- while preserving backward compatibility with ROLE_BUSINESS and existing roles.
-- =============================================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ROLE_USER', 'ROLE_CONTRIBUTOR', 'ROLE_BUSINESS', 'ROLE_BUSINESS_OWNER', 'ROLE_ADMIN'));

