-- =============================================================================
-- V9__accessibility_audit_log_and_enhancements.sql
-- AccessMap – Phase 8: Accessibility Audit Log & Facility Profile Enhancements
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. accessibility_audit_logs table
-- Tracks every change to verified accessibility profiles with full audit trail:
-- who changed what feature, previous status, new status, observation reference,
-- and timestamp.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accessibility_audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id        UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    feature_code    VARCHAR(60) NOT NULL,
    old_status      VARCHAR(30)
                    CHECK (old_status IS NULL OR old_status IN ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED')),
    new_status      VARCHAR(30) NOT NULL
                    CHECK (new_status IN ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED')),
    changed_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
    observation_id  UUID        REFERENCES observation_submissions(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL, -- e.g. 'OBSERVATION_APPROVED', 'ADMIN_OVERRIDE', 'SYSTEM_AUDIT'
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_place_id ON accessibility_audit_logs (place_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON accessibility_audit_logs (changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON accessibility_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_feature ON accessibility_audit_logs (place_id, feature_code);

