-- =============================================================================
-- V8__media_files_and_user_avatars.sql
-- AccessMap – Phase 7.2: Object Storage Media Module & User Avatar Support
-- =============================================================================
-- This migration:
--   1. Adds avatar tracking columns to the users table.
--   2. Creates a media_files table for general object-storage metadata.
--      (profile photos, future report evidence photos)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. media_files table
-- Stores metadata for every file uploaded to object storage (MinIO / S3).
-- Binary content is NOT stored here — only the object key used to retrieve it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_files (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Purpose classification: 'USER_AVATAR' | 'REPORT_EVIDENCE'
    purpose           VARCHAR(50)  NOT NULL,

    -- Full object key within the storage bucket (randomly generated UUID path)
    -- e.g. 'avatars/550e8400-e29b-41d4-a716-446655440000.webp'
    object_key        VARCHAR(500) NOT NULL UNIQUE,

    -- Bucket name (allows future multi-bucket routing)
    bucket_name       VARCHAR(200) NOT NULL,

    -- Validated MIME type after content inspection (never trusts browser declaration)
    mime_type         VARCHAR(100) NOT NULL,

    -- Original file size in bytes (before re-encoding)
    file_size_bytes   BIGINT       NOT NULL,

    -- SHA-256 hex digest of the re-encoded file content (for integrity checks)
    checksum_sha256   VARCHAR(64),

    -- Moderation / visibility: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
    -- Avatars are auto-approved; report evidence starts PENDING_REVIEW.
    visibility        VARCHAR(30)  NOT NULL DEFAULT 'APPROVED',

    -- Optional FK to observation_submissions (populated for REPORT_EVIDENCE files)
    -- NULL for profile avatars.
    report_id         UUID REFERENCES observation_submissions(id) ON DELETE SET NULL,

    uploaded_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index: fast lookup by owner
CREATE INDEX IF NOT EXISTS idx_media_files_owner ON media_files (owner_user_id);
-- Index: fast lookup by purpose (USER_AVATAR queries)
CREATE INDEX IF NOT EXISTS idx_media_files_purpose ON media_files (purpose);
-- Index: report evidence lookup
CREATE INDEX IF NOT EXISTS idx_media_files_report ON media_files (report_id)
    WHERE report_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Add avatar tracking to users
-- avatar_object_key stores the MinIO/S3 object key for quick resolution
-- without an additional JOIN. avatar_media_id FK allows full metadata lookup.
-- ---------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_object_key VARCHAR(500),
    ADD COLUMN IF NOT EXISTS avatar_media_id   UUID REFERENCES media_files(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 3. CHECK constraint: purpose must be a known value
-- ---------------------------------------------------------------------------
ALTER TABLE media_files
    ADD CONSTRAINT media_files_purpose_check
    CHECK (purpose IN ('USER_AVATAR', 'REPORT_EVIDENCE'));

-- ---------------------------------------------------------------------------
-- 4. CHECK constraint: visibility must be a known value
-- ---------------------------------------------------------------------------
ALTER TABLE media_files
    ADD CONSTRAINT media_files_visibility_check
    CHECK (visibility IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED'));

