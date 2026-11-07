-- =============================================================================
-- V13__notifications_and_realtime_updates.sql
-- AccessMap – Phase 13: Notifications and Real-Time Updates
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. notifications table
-- Stores persistent in-app notifications for users, owners, and moderators.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                  VARCHAR(60) NOT NULL,
    title                 VARCHAR(200) NOT NULL,
    message               TEXT NOT NULL,
    related_entity_type   VARCHAR(50), -- 'REPORT', 'DISPUTE', 'PLACE', 'CLAIM', 'OBSERVATION', 'USER'
    related_entity_id     UUID,
    is_read               BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at               TIMESTAMPTZ,
    metadata              TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON notifications(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications(recipient_user_id, is_read)
    WHERE is_read = false;

-- ---------------------------------------------------------------------------
-- 2. notification_preferences table
-- User-configurable channel delivery settings per notification type.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type     VARCHAR(60) NOT NULL,
    in_app_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_notification_type UNIQUE (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user
    ON notification_preferences(user_id);

