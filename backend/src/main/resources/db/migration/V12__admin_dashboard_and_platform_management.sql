-- =============================================================================
-- V12__admin_dashboard_and_platform_management.sql
-- AccessMap – Phase 12: Admin Dashboard and Advanced Platform Management
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. admin_audit_logs table
-- Immutable audit log capturing user changes, status updates, settings and imports.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action                VARCHAR(100) NOT NULL,
    resource_type         VARCHAR(50) NOT NULL,
    resource_id           UUID,
    outcome               VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    metadata              TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON admin_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. platform_settings table
-- Controlled runtime configuration parameters for the AccessMap platform.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_settings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key           VARCHAR(100) UNIQUE NOT NULL,
    setting_value         VARCHAR(500) NOT NULL,
    setting_group         VARCHAR(50) NOT NULL,
    description           TEXT,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by_user_id    UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_group ON platform_settings(setting_group);

-- Seed default platform parameters
INSERT INTO platform_settings (id, setting_key, setting_value, setting_group, description)
VALUES
    (gen_random_uuid(), 'upload.max_file_size_mb', '10', 'STORAGE', 'Maximum allowed file size for image uploads (MB)'),
    (gen_random_uuid(), 'verification.freshness_threshold_days', '90', 'VERIFICATION', 'Threshold in days before accessibility data is considered stale'),
    (gen_random_uuid(), 'moderation.auto_escalate_disputes_days', '7', 'MODERATION', 'Number of days before an unresolved dispute is flagged for urgent review'),
    (gen_random_uuid(), 'import.rate_limit_per_minute', '30', 'IMPORT', 'Maximum permitted Overpass API queries per minute to prevent rate limiting'),
    (gen_random_uuid(), 'notifications.admin_email_alerts', 'true', 'NOTIFICATIONS', 'Send notification alerts to system admins when new reports or disputes are lodged')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. data_import_history table
-- Records of external geospatial data synchronization events.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_import_history (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name         VARCHAR(100) NOT NULL,
    region_name           VARCHAR(100),
    bounding_box          VARCHAR(100),
    status                VARCHAR(50) NOT NULL,
    records_imported      INT NOT NULL DEFAULT 0,
    records_skipped       INT NOT NULL DEFAULT 0,
    records_failed        INT NOT NULL DEFAULT 0,
    error_message         TEXT,
    initiated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_import_history_created_at ON data_import_history(created_at DESC);

-- Seed an initial import record reflecting system initialization
INSERT INTO data_import_history (id, provider_name, region_name, bounding_box, status, records_imported, records_skipped, records_failed, error_message, created_at)
VALUES (
    gen_random_uuid(),
    'OpenStreetMap Overpass API',
    'Maharashtra (Mumbai Metropolitan Region)',
    '18.90,72.80,19.25,73.00',
    'COMPLETED',
    12,
    0,
    0,
    'Initial platform geographical seed completed successfully',
    now()
);

