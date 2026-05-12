-- =============================================================
-- HOSTING MODULE — POSTGRES MIGRATION
-- =============================================================
-- Run in order. All tables use UUIDs as primary keys.
-- Assumes an existing `users` table with columns:
--   id UUID PRIMARY KEY, role TEXT (values: 'admin', 'sport_body')
-- Adjust FK references if your user table differs.
-- =============================================================

-- Enable UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- 1. EVENTS
--    Created by system admins. Sport bodies browse and bid.
-- -------------------------------------------------------------
CREATE TYPE event_status AS ENUM (
    'draft',           -- admin is still editing, not visible to sport bodies
    'open_for_bids',   -- published, accepting applications
    'closed',          -- deadline passed, no new bids accepted
    'awarded'          -- a winner has been selected
);

CREATE TABLE events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by          UUID NOT NULL REFERENCES users(id),

    title               TEXT NOT NULL,
    sport               TEXT NOT NULL,
    description         TEXT,
    location            TEXT,                        -- suggested or preferred host city/region
    event_start_date    DATE,
    event_end_date      DATE,
    bid_deadline        TIMESTAMPTZ NOT NULL,         -- when the bid window closes automatically
    max_bids            INT,                          -- optional cap on applications

    -- Checklist of document types applicants must upload before submitting.
    -- Stored as a text array e.g. {'financial_plan','hosting_plan','risk_plan'}
    required_documents  TEXT[] NOT NULL DEFAULT '{}',

    -- Any files the admin attaches for the sport body to download (bid pack, specs, etc.)
    bid_pack_url        TEXT,

    status              event_status NOT NULL DEFAULT 'draft',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_status        ON events(status);
CREATE INDEX idx_events_bid_deadline  ON events(bid_deadline);
CREATE INDEX idx_events_created_by    ON events(created_by);

-- -------------------------------------------------------------
-- 2. BIDS
--    One row per sport body per event.
--    Sport bodies save drafts before submitting.
-- -------------------------------------------------------------
CREATE TYPE bid_status AS ENUM (
    'draft',           -- sport body is still filling in the application
    'submitted',       -- sport body submitted; admin notified
    'under_review',    -- admin has opened the bid
    'info_requested',  -- admin asked for more information; bid re-opened for edits
    'approved',        -- this bid won
    'rejected'         -- this bid was not selected
);

CREATE TABLE bids (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sport_body_id       UUID NOT NULL REFERENCES users(id),

    -- Application form fields (mirrors the policy's hosting plan sections)
    organisation_name       TEXT NOT NULL,
    executive_support_proof TEXT,                    -- description or reference to uploaded doc
    event_objectives        TEXT,
    expected_benefits       TEXT,

    -- Hosting plan sections (free text; frontend renders as rich text or textarea)
    resource_mobilisation   TEXT,
    infrastructure_plan     TEXT,
    competition_plan        TEXT,
    volunteer_plan          TEXT,
    transport_plan          TEXT,
    security_plan           TEXT,
    accommodation_plan      TEXT,
    catering_plan           TEXT,
    marketing_plan          TEXT,
    risk_management_plan    TEXT,
    communication_strategy  TEXT,

    -- Financial
    total_budget            NUMERIC(18, 2),
    government_funding_pct  NUMERIC(5, 2),           -- % of budget relying on govt support
    income_breakdown        TEXT,
    expenditure_breakdown   TEXT,

    -- Technical capacity
    technical_officials     TEXT,
    training_plan           TEXT,

    -- Legacy / benefits
    social_benefits         TEXT,
    economic_benefits       TEXT,
    cultural_benefits       TEXT,
    legacy_plan             TEXT,

    status                  bid_status NOT NULL DEFAULT 'draft',

    -- Admin actions
    admin_notes             TEXT,                    -- internal notes, never shown to sport body
    info_request_message    TEXT,                    -- message sent when status = info_requested
    info_request_deadline   TIMESTAMPTZ,
    info_request_at         TIMESTAMPTZ,
    reviewed_by             UUID REFERENCES users(id),
    reviewed_at             TIMESTAMPTZ,
    awarded_at              TIMESTAMPTZ,

    submitted_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- A sport body can only have one bid per event
    UNIQUE (event_id, sport_body_id)
);

CREATE INDEX idx_bids_event_id       ON bids(event_id);
CREATE INDEX idx_bids_sport_body_id  ON bids(sport_body_id);
CREATE INDEX idx_bids_status         ON bids(status);

-- -------------------------------------------------------------
-- 3. BID DOCUMENTS
--    Files uploaded by sport bodies against a bid.
--    Each row is one file; document_type must match one of the
--    strings in events.required_documents for that event.
-- -------------------------------------------------------------
CREATE TABLE bid_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id          UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,

    document_type   TEXT NOT NULL,    -- e.g. 'financial_plan', 'hosting_plan', 'risk_plan'
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,    -- S3/storage URL
    file_size_bytes BIGINT,
    mime_type       TEXT,

    uploaded_by     UUID NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bid_documents_bid_id ON bid_documents(bid_id);

-- -------------------------------------------------------------
-- 4. NOTIFICATIONS
--    In-app notification log. Email is sent externally;
--    this table drives the in-app bell icon / notification list.
-- -------------------------------------------------------------
CREATE TYPE notification_type AS ENUM (
    'event_published',       -- to sport bodies: new event open for bids
    'bid_received',          -- to admin: a sport body submitted a bid
    'info_requested',        -- to sport body: admin wants more information
    'bid_approved',          -- to sport body: they won
    'bid_rejected',          -- to sport body: they did not win
    'bid_deadline_closing',  -- to sport bodies with drafts: deadline approaching
    'event_awarded'          -- to admin: winner confirmed
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,

    -- Flexible context payload (event_id, bid_id, message, etc.)
    payload         JSONB NOT NULL DEFAULT '{}',
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient  ON notifications(recipient_id);
CREATE INDEX idx_notifications_read_at    ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- -------------------------------------------------------------
-- 5. UPDATED_AT TRIGGER
--    Keeps updated_at fresh on events and bids automatically.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------
-- 6. HELPER VIEW — bid completeness check
--    Used by the backend to gate submission: returns the list
--    of required document types not yet uploaded for a bid.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW bid_missing_documents AS
SELECT
    b.id                                        AS bid_id,
    e.id                                        AS event_id,
    unnest(e.required_documents)                AS required_type,
    EXISTS (
        SELECT 1 FROM bid_documents bd
        WHERE bd.bid_id = b.id
          AND bd.document_type = unnest(e.required_documents)
    )                                           AS uploaded
FROM bids b
JOIN events e ON e.id = b.event_id;