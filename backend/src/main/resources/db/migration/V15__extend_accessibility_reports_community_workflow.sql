-- =============================================================================
-- V15__extend_accessibility_reports_community_workflow.sql
-- AccessMap - Community Report Workflow Enhancement
-- =============================================================================
-- Adds support for report types (ACCESSIBILITY_ISSUE, ACCESSIBILITY_IMPROVEMENT,
-- VISIT_REVIEW), observation statuses, visitor impact, visit sources,
-- ratings, and structured review responses to community reports.
-- =============================================================================

ALTER TABLE accessibility_reports
    ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'ACCESSIBILITY_ISSUE',
    ADD COLUMN IF NOT EXISTS observation_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS impact VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_present VARCHAR(20),
    ADD COLUMN IF NOT EXISTS observation_source VARCHAR(50),
    ADD COLUMN IF NOT EXISTS rating INTEGER,
    ADD COLUMN IF NOT EXISTS what_liked TEXT,
    ADD COLUMN IF NOT EXISTS what_improved TEXT,
    ADD COLUMN IF NOT EXISTS what_to_know TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_type ON accessibility_reports (report_type);
