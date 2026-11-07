-- =============================================================================
-- V10__community_accessibility_reports.sql
-- AccessMap – Phase 9: Community Accessibility Reporting and Photo Evidence
-- =============================================================================
-- Creates the schema for community accessibility incident and issue reports,
-- supporting photographic evidence, moderation workflow, and audit integration.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. accessibility_reports table
-- Tracks user-submitted accessibility barriers, broken facilities, and issues.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accessibility_reports (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id              UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    reporting_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Standardized report categories
    category              VARCHAR(100) NOT NULL,

    -- Specific accessibility feature type or code (optional link to FeatureType)
    issue_type            VARCHAR(100),

    title                 VARCHAR(200) NOT NULL,
    description           TEXT NOT NULL,
    observation_date      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Optional GPS coordinates recorded at the scene of the barrier
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,

    -- Workflow status: PENDING -> IN_REVIEW -> APPROVED | REJECTED -> RESOLVED
    status                VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Moderation records
    admin_notes           TEXT,
    reviewed_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at           TIMESTAMPTZ,
    resolved_at           TIMESTAMPTZ,

    -- Flag indicating whether approval contributed to official accessibility profile update
    profile_updated       BOOLEAN NOT NULL DEFAULT FALSE,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_report_status CHECK (
        status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED')
    )
);

CREATE INDEX IF NOT EXISTS idx_reports_place_id ON accessibility_reports(place_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporting_user ON accessibility_reports(reporting_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON accessibility_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON accessibility_reports(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. report_photos table
-- Stores photographic evidence references attached to community reports.
-- Photos are physically stored in object storage (MinIO) via MediaStorageService.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_photos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id             UUID NOT NULL REFERENCES accessibility_reports(id) ON DELETE CASCADE,
    media_file_id         UUID REFERENCES media_files(id) ON DELETE SET NULL,
    photo_url             VARCHAR(1000) NOT NULL,
    object_key            VARCHAR(500),
    caption               VARCHAR(500),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_photos_report_id ON report_photos(report_id);

-- ---------------------------------------------------------------------------
-- 3. Extend media_files to support direct linking to accessibility_reports
-- ---------------------------------------------------------------------------
ALTER TABLE media_files
    ADD COLUMN IF NOT EXISTS accessibility_report_id UUID REFERENCES accessibility_reports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_media_files_acc_report ON media_files(accessibility_report_id)
    WHERE accessibility_report_id IS NOT NULL;

