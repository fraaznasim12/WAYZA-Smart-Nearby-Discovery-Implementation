-- =============================================================================
-- V1__initial_schema.sql
-- AccessMap — Initial Database Schema
--
-- Executed by Flyway on first startup.
-- Requires PostgreSQL 16 + PostGIS 3.4 (provided by the Docker Compose container).
--
-- Design rules:
--   - All PKs are UUIDs (gen_random_uuid()).
--   - All geometry columns use SRID 4326 (WGS84 lat/lng — standard GPS coordinates).
--   - Spatial GIST indexes enable sub-50ms proximity queries via ST_DWithin.
--   - The four-state accessibility model is enforced by VARCHAR CHECK constraints.
-- =============================================================================

-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgcrypto for gen_random_uuid() (PostgreSQL < 14 compatibility)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- USERS & AUTHENTICATION
-- =============================================================================

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(30)  NOT NULL DEFAULT 'ROLE_USER'
                  CHECK (role IN ('ROLE_USER', 'ROLE_CONTRIBUTOR', 'ROLE_BUSINESS', 'ROLE_ADMIN')),
    is_enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users (email);

-- =============================================================================
-- USER ACCESSIBILITY PREFERENCE PROFILES
-- =============================================================================

CREATE TABLE user_preference_profiles (
    id                           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                      UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    requires_step_free_entrance  BOOLEAN NOT NULL DEFAULT FALSE,
    requires_elevator            BOOLEAN NOT NULL DEFAULT FALSE,
    requires_ramp                BOOLEAN NOT NULL DEFAULT FALSE,
    requires_accessible_restroom BOOLEAN NOT NULL DEFAULT FALSE,
    requires_accessible_parking  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PLACES (Core Venue Entity with PostGIS Spatial Point)
-- =============================================================================

CREATE TABLE places (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(60)  NOT NULL
                CHECK (category IN (
                    'HOSPITAL', 'COLLEGE', 'TRANSIT_STATION',
                    'RESTAURANT', 'PUBLIC_OFFICE', 'SHOPPING_MALL', 'OTHER'
                )),
    address     TEXT         NOT NULL,
    city        VARCHAR(100),
    country     VARCHAR(100) NOT NULL DEFAULT 'India',
    -- PostGIS spatial point: SRID 4326 = WGS84 (standard GPS lat/lng)
    geom        GEOMETRY(Point, 4326) NOT NULL,
    phone       VARCHAR(30),
    website     VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- GIST spatial index enables ST_DWithin proximity queries in under 50ms
CREATE INDEX idx_places_geom     ON places USING GIST (geom);
CREATE INDEX idx_places_category ON places (category);
CREATE INDEX idx_places_active   ON places (is_active);

-- =============================================================================
-- ACCESSIBILITY FEATURES (4-State Model per Feature per Place)
-- =============================================================================

CREATE TABLE accessibility_features (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id         UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,

    -- The type of accessibility feature being tracked
    feature_type     VARCHAR(60) NOT NULL
                     CHECK (feature_type IN (
                         'STEP_FREE_ENTRANCE', 'RAMP', 'ELEVATOR',
                         'ACCESSIBLE_RESTROOM', 'ACCESSIBLE_PARKING',
                         'PUBLIC_TRANSPORT_ACCESSIBILITY'
                     )),

    -- Four-State Verification Model (CRITICAL DOMAIN RULE — see PROJECT_RULES.md Rule 8)
    -- UNKNOWN must NEVER be treated as NOT_AVAILABLE.
    status           VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN'
                     CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED')),

    notes            TEXT,
    last_verified_at TIMESTAMPTZ,

    -- Each place has at most one record per feature type
    CONSTRAINT uq_place_feature UNIQUE (place_id, feature_type)
);

CREATE INDEX idx_features_place_id ON accessibility_features (place_id);
CREATE INDEX idx_features_status   ON accessibility_features (status);

-- =============================================================================
-- ACCESSIBILITY REPORTS (Community Audit Submission Trail)
-- =============================================================================

CREATE TABLE accessibility_reports (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id            UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    submitted_by        UUID        REFERENCES users(id) ON DELETE SET NULL,

    feature_type        VARCHAR(60) NOT NULL
                        CHECK (feature_type IN (
                            'STEP_FREE_ENTRANCE', 'RAMP', 'ELEVATOR',
                            'ACCESSIBLE_RESTROOM', 'ACCESSIBLE_PARKING',
                            'PUBLIC_TRANSPORT_ACCESSIBILITY'
                        )),

    reported_status     VARCHAR(30) NOT NULL
                        CHECK (reported_status IN ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN', 'NOT_VERIFIED')),

    -- Audit trail fields (required per REQUIREMENTS.md FR-6.2)
    source              VARCHAR(60) NOT NULL DEFAULT 'USER'
                        CHECK (source IN ('USER', 'CONTRIBUTOR', 'BUSINESS_OWNER', 'ADMIN', 'IMPORT')),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'STALE')),

    notes               TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at         TIMESTAMPTZ
);

CREATE INDEX idx_reports_place_id    ON accessibility_reports (place_id);
CREATE INDEX idx_reports_submitted_by ON accessibility_reports (submitted_by);
CREATE INDEX idx_reports_status       ON accessibility_reports (verification_status);

-- =============================================================================
-- REPORT PHOTOS (Photo Evidence Attachments)
-- =============================================================================

CREATE TABLE report_photos (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID        NOT NULL REFERENCES accessibility_reports(id) ON DELETE CASCADE,
    photo_url   VARCHAR(500) NOT NULL,
    caption     VARCHAR(255),
    is_verified BOOLEAN     NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- REPORT DISPUTES (Community Flagging & Moderation Queue)
-- =============================================================================

CREATE TABLE report_disputes (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id        UUID        NOT NULL REFERENCES accessibility_reports(id) ON DELETE CASCADE,
    raised_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
    reason           TEXT        NOT NULL,
    dispute_status   VARCHAR(30) NOT NULL DEFAULT 'OPEN'
                     CHECK (dispute_status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    resolution_notes TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at      TIMESTAMPTZ
);

