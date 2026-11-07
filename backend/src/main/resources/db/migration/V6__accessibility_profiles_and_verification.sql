-- =============================================================================
-- V6__accessibility_profiles_and_verification.sql
-- AccessMap — Phase 8: Accessibility Feature Catalogue, Observation Submissions,
-- and Verification Review Workflow
-- =============================================================================

-- 1. ACCESSIBILITY FEATURE DEFINITIONS (Catalogue)
-- Allows feature definitions to be extended dynamically without hardcoding enums
CREATE TABLE IF NOT EXISTS feature_definitions (
    code          VARCHAR(60)  PRIMARY KEY,
    category      VARCHAR(50)  NOT NULL,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    icon          VARCHAR(50),
    display_order INT          NOT NULL DEFAULT 0,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feature_def_category ON feature_definitions (category);
CREATE INDEX IF NOT EXISTS idx_feature_def_active ON feature_definitions (is_active);

-- 2. SEED THE 21 SPECIFIED ACCESSIBILITY FEATURES
INSERT INTO feature_definitions (code, category, name, description, icon, display_order)
VALUES
    -- ENTRANCE
    ('WHEELCHAIR_ACCESSIBLE_ENTRANCE', 'ENTRANCE', 'Wheelchair-accessible entrance', 'Primary or dedicated level entrance accessible to wheeled mobility devices.', 'Accessibility', 1),
    ('STEP_FREE_ENTRANCE', 'ENTRANCE', 'Step-free entrance', 'Entrance with zero steps or level threshold transitions under 1/2 inch.', 'DoorOpen', 2),
    ('ENTRANCE_RAMP', 'ENTRANCE', 'Entrance ramp', 'Permanent ramp with maximum 1:12 slope and sturdy dual handrails.', 'ArrowUpRight', 3),
    ('AUTOMATIC_DOORS', 'ENTRANCE', 'Automatic doors', 'Motion sensor or push-button power-assisted entrance doors.', 'Maximize2', 4),
    ('DOORWAY_ACCESSIBILITY_INFO', 'ENTRANCE', 'Doorway accessibility information', 'Clear opening width of at least 32 inches (815mm) with low-resistance opening force.', 'Info', 5),

    -- VERTICAL ACCESS
    ('ELEVATOR_AVAILABILITY', 'VERTICAL_ACCESS', 'Elevator availability', 'Functioning passenger elevator serving all public and commercial floors.', 'ArrowUpDown', 6),
    ('ELEVATOR_ACCESSIBILITY', 'VERTICAL_ACCESS', 'Elevator accessibility', 'Braille buttons, audible floor announcements, and minimum cab dimensions for wheelchairs.', 'Layers', 7),
    ('STAIR_FREE_ACCESS', 'VERTICAL_ACCESS', 'Stair-free access', 'Complete continuous pathways between levels without requiring stair traversal.', 'Footprints', 8),
    ('HANDRAILS', 'VERTICAL_ACCESS', 'Handrails', 'Continuous handrails on both sides of all access ramps and stairways.', 'GitCommit', 9),

    -- RESTROOM
    ('ACCESSIBLE_WASHROOM', 'RESTROOM', 'Accessible washroom', 'Designated washroom with wheelchair turning radius of 60 inches minimum.', 'Bath', 10),
    ('WHEELCHAIR_ACCESSIBLE_RESTROOM', 'RESTROOM', 'Wheelchair-accessible restroom', 'Equipped with reinforced grab bars, roll-under sink, and accessible locks.', 'ShieldCheck', 11),
    ('ACCESSIBLE_RESTROOM_SIGNAGE', 'RESTROOM', 'Accessible restroom signage', 'High-contrast directional signage and tactile braille restroom indicators.', 'Signpost', 12),

    -- PARKING
    ('ACCESSIBLE_PARKING', 'PARKING', 'Accessible parking', 'Dedicated accessible parking stalls located near primary accessible entrances.', 'Car', 13),
    ('RESERVED_WHEELCHAIR_PARKING', 'PARKING', 'Reserved wheelchair parking', 'Extra-wide van-accessible parking spaces with striped access aisles.', 'CircleParking', 14),

    -- PATHWAYS
    ('WHEELCHAIR_ACCESSIBLE_PATHWAYS', 'PATHWAYS', 'Wheelchair-accessible pathways', 'Paved, unobstructed interior and exterior pathways at least 36 inches wide.', 'Navigation', 15),
    ('ACCESSIBLE_RECEPTION_COUNTERS', 'PATHWAYS', 'Accessible reception counters', 'Service or reception counter section at or below 34 inches (865mm) height.', 'CreditCard', 16),
    ('ACCESSIBLE_SEATING', 'PATHWAYS', 'Accessible seating', 'Designated companion and wheelchair-integrated seating spaces in waiting/dining areas.', 'Armchair', 17),

    -- ADDITIONAL
    ('BRAILLE_SIGNAGE', 'ADDITIONAL', 'Braille signage', 'Standard Grade 2 tactile and braille room and service location signs.', 'Binary', 18),
    ('TACTILE_INDICATORS', 'ADDITIONAL', 'Tactile indicators', 'Ground surface tactile paving tiles warning of hazards, platforms, and curbs.', 'Grid', 19),
    ('AUDIO_ASSISTANCE', 'ADDITIONAL', 'Audio assistance', 'Hearing induction loops, audio beacons, or assistive listening systems installed.', 'Volume2', 20),
    ('STAFF_ASSISTANCE', 'ADDITIONAL', 'Staff assistance', 'Staff trained in accessibility accommodations and guided assistance available on-site.', 'Users', 21)
ON CONFLICT (code) DO NOTHING;

-- 3. DROP HARDCODED CHECK CONSTRAINTS ON FEATURE TYPES
-- Allows using the full dynamic catalogue in features, reports, and photos
ALTER TABLE accessibility_features DROP CONSTRAINT IF EXISTS accessibility_features_feature_type_check;
ALTER TABLE accessibility_reports DROP CONSTRAINT IF EXISTS accessibility_reports_feature_type_check;
ALTER TABLE report_images DROP CONSTRAINT IF EXISTS report_images_feature_type_check;

-- 4. PLACE OWNERSHIPS TABLE
-- Governs ROLE_BUSINESS_OWNER claims and verified location updates
CREATE TABLE IF NOT EXISTS place_ownerships (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id    UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_verified BOOLEAN     NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_place_user_ownership UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_place_ownership_place ON place_ownerships (place_id);
CREATE INDEX IF NOT EXISTS idx_place_ownership_user  ON place_ownerships (user_id);

-- 5. OBSERVATION SUBMISSIONS TABLE
-- Master record for community & business owner accessibility observation checklists
CREATE TABLE IF NOT EXISTS observation_submissions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id            UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    submitted_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
    submission_type     VARCHAR(30) NOT NULL DEFAULT 'COMMUNITY'
                        CHECK (submission_type IN ('COMMUNITY', 'BUSINESS_OWNER', 'ADMIN')),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                        CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    observation_date    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description         TEXT,
    reviewed_by         UUID        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMPTZ,
    review_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_obs_place_id ON observation_submissions (place_id);
CREATE INDEX IF NOT EXISTS idx_obs_submitter ON observation_submissions (submitted_by);
CREATE INDEX IF NOT EXISTS idx_obs_status    ON observation_submissions (verification_status);

-- 6. OBSERVATION SUBMISSION ITEMS TABLE
-- Individual feature checklist items in each observation submission
CREATE TABLE IF NOT EXISTS observation_submission_items (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id  UUID        NOT NULL REFERENCES observation_submissions(id) ON DELETE CASCADE,
    feature_code   VARCHAR(60) NOT NULL,
    status         VARCHAR(30) NOT NULL
                   CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED')),
    notes          TEXT,
    CONSTRAINT uq_submission_feature UNIQUE (submission_id, feature_code)
);

CREATE INDEX IF NOT EXISTS idx_obs_item_submission ON observation_submission_items (submission_id);
CREATE INDEX IF NOT EXISTS idx_obs_item_feature    ON observation_submission_items (feature_code);

-- 7. OBSERVATION EVIDENCE TABLE
-- Photo attachments and documentation URLs for verification evidence
CREATE TABLE IF NOT EXISTS observation_evidence (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id  UUID         NOT NULL REFERENCES observation_submissions(id) ON DELETE CASCADE,
    image_url      VARCHAR(1000) NOT NULL,
    caption        VARCHAR(255),
    feature_code   VARCHAR(60),
    uploaded_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_obs_evidence_submission ON observation_evidence (submission_id);

