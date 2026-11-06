-- =============================================================================
-- V3__place_accessibility_and_verifications.sql
-- AccessMap — Place Accessibility Aggregation, Report Images & Verifications
--
-- Adds tables required by the Phase 4 database foundation without duplicating V1/V2:
--   1. place_accessibility  - Aggregate accessibility snapshot per place
--   2. report_images        - Image attachments for community field reports
--   3. verifications        - Audit verification log (community, business, admin)
-- =============================================================================

-- 1. PLACE ACCESSIBILITY AGGREGATE TABLE
CREATE TABLE IF NOT EXISTS place_accessibility (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id                UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE UNIQUE,
    overall_status          VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN'
                            CHECK (overall_status IN ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED')),
    verified_features_count INT         NOT NULL DEFAULT 0,
    total_features_count    INT         NOT NULL DEFAULT 6,
    last_audit_at           TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_place_accessibility_status ON place_accessibility (overall_status);

-- 2. REPORT IMAGES TABLE (Field Photo Attachments)
CREATE TABLE IF NOT EXISTS report_images (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id      UUID         NOT NULL REFERENCES accessibility_reports(id) ON DELETE CASCADE,
    image_url      VARCHAR(500) NOT NULL,
    thumbnail_url  VARCHAR(500),
    caption        VARCHAR(255),
    feature_type   VARCHAR(60)
                   CHECK (feature_type IN (
                       'STEP_FREE_ENTRANCE', 'RAMP', 'ELEVATOR',
                       'ACCESSIBLE_RESTROOM', 'ACCESSIBLE_PARKING',
                       'PUBLIC_TRANSPORT_ACCESSIBILITY'
                   )),
    is_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    uploaded_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_images_report ON report_images (report_id);

-- 3. VERIFICATIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS verifications (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id         UUID        REFERENCES accessibility_reports(id) ON DELETE CASCADE,
    place_id          UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    verified_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
    verification_type VARCHAR(30) NOT NULL DEFAULT 'COMMUNITY_AUDIT'
                      CHECK (verification_type IN (
                          'COMMUNITY_AUDIT', 'CERTIFIED_INSPECTION',
                          'BUSINESS_VERIFICATION', 'ADMIN_REVIEW'
                      )),
    decision          VARCHAR(30) NOT NULL
                      CHECK (decision IN ('CONFIRMED', 'REJECTED', 'DISPUTED')),
    notes             TEXT,
    verified_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verifications_place  ON verifications (place_id);
CREATE INDEX IF NOT EXISTS idx_verifications_report ON verifications (report_id);

