-- =============================================================================
-- V14: Community Place Reviews
-- Allows authenticated users to submit reviews with ratings, visit dates,
-- accessibility notes, and optional photos for a place.
-- Reviews go through a moderation lifecycle: PENDING → APPROVED / REJECTED.
-- IMPORTANT: Community reviews NEVER overwrite independently verified
--            accessibility profiles.
-- =============================================================================

CREATE TABLE IF NOT EXISTS place_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Core review content
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    visit_date      DATE,
    review_text     TEXT CHECK (char_length(review_text) <= 2000),
    accessibility_summary TEXT CHECK (char_length(accessibility_summary) <= 1000),

    -- Structured accessibility checkboxes (stored as flags)
    had_accessible_entrance     BOOLEAN DEFAULT FALSE,
    had_accessible_restroom     BOOLEAN DEFAULT FALSE,
    had_accessible_parking      BOOLEAN DEFAULT FALSE,
    had_elevator                BOOLEAN DEFAULT FALSE,
    had_step_free_path          BOOLEAN DEFAULT FALSE,
    had_staff_assistance        BOOLEAN DEFAULT FALSE,

    -- Moderation
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    moderated_by    UUID REFERENCES users(id),
    moderated_at    TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching reviews for a place (most recent first)
CREATE INDEX IF NOT EXISTS idx_place_reviews_place_status
    ON place_reviews (place_id, status, created_at DESC);

-- Index for a user's own reviews
CREATE INDEX IF NOT EXISTS idx_place_reviews_user
    ON place_reviews (user_id, created_at DESC);

-- A user can submit only one review per place
CREATE UNIQUE INDEX IF NOT EXISTS idx_place_reviews_user_place
    ON place_reviews (user_id, place_id);

-- Review photos (up to 5 per review)
CREATE TABLE IF NOT EXISTS review_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID NOT NULL REFERENCES place_reviews(id) ON DELETE CASCADE,
    file_key    TEXT NOT NULL,
    url         TEXT NOT NULL,
    caption     TEXT CHECK (char_length(caption) <= 200),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_photos_review
    ON review_photos (review_id);

-- Trigger to update `updated_at` on place_reviews automatically
CREATE OR REPLACE FUNCTION update_place_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_place_reviews_updated_at ON place_reviews;
CREATE TRIGGER trg_place_reviews_updated_at
    BEFORE UPDATE ON place_reviews
    FOR EACH ROW EXECUTE FUNCTION update_place_reviews_updated_at();

