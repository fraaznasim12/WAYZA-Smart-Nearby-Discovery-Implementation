-- =============================================================================
-- V11__advanced_verification_and_disputes.sql
-- AccessMap – Phase 10: Advanced Verification and Dispute Management
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Upgrade accessibility_reports: Add extended statuses and assignment
-- ---------------------------------------------------------------------------
ALTER TABLE accessibility_reports
    DROP CONSTRAINT IF EXISTS chk_report_status;

ALTER TABLE accessibility_reports
    ADD CONSTRAINT chk_report_status CHECK (
        status IN (
            'PENDING',
            'IN_REVIEW',
            'APPROVED',
            'REJECTED',
            'NEEDS_MORE_INFORMATION',
            'DISPUTED',
            'RESOLVED'
        )
    );

ALTER TABLE accessibility_reports
    ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS info_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reports_assigned_reviewer ON accessibility_reports(assigned_reviewer_id)
    WHERE assigned_reviewer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. disputes table
-- Handles community disputes on accessibility info, approvals, and rejections.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disputes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id              UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    report_id             UUID REFERENCES accessibility_reports(id) ON DELETE SET NULL,
    observation_id        UUID REFERENCES observation_submissions(id) ON DELETE SET NULL,
    feature_code          VARCHAR(100),

    submitting_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Standardized dispute categories:
    -- 'INCORRECT_ACCESSIBILITY_INFO', 'OUTDATED_FACILITY_INFO',
    -- 'INCORRECT_REPORT_APPROVAL', 'INCORRECT_REPORT_REJECTION', 'FEATURE_STATUS_CHANGE'
    category              VARCHAR(100) NOT NULL,

    explanation           TEXT NOT NULL,

    -- Dispute workflow statuses:
    -- 'OPEN', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'UPHELD', 'OVERTURNED', 'CLOSED'
    status                VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    assigned_reviewer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes      TEXT,
    resolved_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at           TIMESTAMPTZ,

    -- Flag indicating if dispute resolution caused an automatic feature profile update
    profile_corrected     BOOLEAN NOT NULL DEFAULT FALSE,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_dispute_status CHECK (
        status IN (
            'OPEN',
            'UNDER_REVIEW',
            'ADDITIONAL_INFORMATION_REQUIRED',
            'UPHELD',
            'OVERTURNED',
            'CLOSED'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_disputes_place_id ON disputes(place_id);
CREATE INDEX IF NOT EXISTS idx_disputes_submitting_user ON disputes(submitting_user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_report_id ON disputes(report_id) WHERE report_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_reviewer ON disputes(assigned_reviewer_id) WHERE assigned_reviewer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. dispute_photos table
-- Stores evidence photos attached to disputes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispute_photos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id            UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    media_file_id         UUID REFERENCES media_files(id) ON DELETE SET NULL,
    photo_url             VARCHAR(1000) NOT NULL,
    object_key            VARCHAR(500),
    caption               VARCHAR(500),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_photos_dispute_id ON dispute_photos(dispute_id);

-- ---------------------------------------------------------------------------
-- 4. review_assignments table
-- Tracks assigning moderator review tasks for reports and disputes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_assignments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type           VARCHAR(50) NOT NULL, -- 'REPORT' | 'DISPUTE' | 'OBSERVATION'
    target_id             UUID NOT NULL,
    assigned_to_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED', -- 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_target ON review_assignments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_assigned_to ON review_assignments(assigned_to_user_id);

-- ---------------------------------------------------------------------------
-- 5. moderation_actions table
-- Full immutable audit trail of every moderator action and status transition.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_actions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type           VARCHAR(50) NOT NULL, -- 'REPORT' | 'DISPUTE' | 'OBSERVATION' | 'FEATURE'
    target_id             UUID NOT NULL,
    action                VARCHAR(100) NOT NULL,
    actor_user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor ON moderation_actions(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

