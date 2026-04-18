--
-- PostgreSQL database dump
--

\restrict yUglrBvTUPirdeKeYpeESVAhp51a3mkWg2CxJkgNqj6EdKL8C4qjyUW0LHjZwBm

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: account_status; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.account_status AS ENUM (
    'pending_profile',
    'pending_approval',
    'active',
    'suspended',
    'rejected',
    'inactive'
);


ALTER TYPE public.account_status OWNER TO ztap_user;

--
-- Name: age_group; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.age_group AS ENUM (
    'senior',
    'u23',
    'u20',
    'u18',
    'u17',
    'u15',
    'mixed'
);


ALTER TYPE public.age_group OWNER TO ztap_user;

--
-- Name: application_status; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.application_status AS ENUM (
    'draft',
    'awaiting_payment',
    'submitted',
    'under_review',
    'awaiting_information',
    'approved',
    'rejected',
    'certificate_issued',
    'withdrawn',
    'awaiting_immigration',
    'awaiting_zifa',
    'awaiting_src',
    'awaiting_body'
);


ALTER TYPE public.application_status OWNER TO ztap_user;

--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.approval_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'information_requested'
);


ALTER TYPE public.approval_status OWNER TO ztap_user;

--
-- Name: approver_body; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.approver_body AS ENUM (
    'SPORT_BODY',
    'SRC',
    'IMMIGRATION'
);


ALTER TYPE public.approver_body OWNER TO ztap_user;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.audit_action AS ENUM (
    'user_registered',
    'user_email_verified',
    'user_logged_in',
    'user_logged_out',
    'user_login_failed',
    'user_locked',
    'user_password_reset_requested',
    'user_password_changed',
    'user_activated',
    'user_deactivated',
    'user_suspended',
    'user_role_changed',
    'user_deleted',
    'organisation_profile_created',
    'organisation_profile_updated',
    'organisation_profile_submitted',
    'organisation_approved',
    'organisation_rejected',
    'organisation_suspended',
    'organisation_reactivated',
    'organisation_info_requested',
    'application_created',
    'application_updated',
    'application_submitted',
    'application_withdrawn',
    'application_flagged',
    'application_unflagged',
    'application_priority_changed',
    'approval_assigned',
    'approval_reassigned',
    'approval_opened',
    'approval_approved',
    'approval_rejected',
    'approval_info_requested',
    'approval_overridden',
    'payment_initiated',
    'payment_confirmed',
    'payment_failed',
    'payment_refunded',
    'document_uploaded',
    'document_reviewed',
    'document_deleted',
    'certificate_issued',
    'certificate_downloaded',
    'certificate_revoked',
    'invitation_sent',
    'invitation_resent',
    'invitation_accepted',
    'invitation_revoked',
    'invitation_expired',
    'information_request_sent',
    'information_request_responded',
    'system_overdue_check'
);


ALTER TYPE public.audit_action OWNER TO ztap_user;

--
-- Name: audit_entity_type; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.audit_entity_type AS ENUM (
    'user',
    'organisation',
    'application',
    'approval',
    'payment',
    'document',
    'certificate',
    'invitation',
    'information_request',
    'internal_note',
    'notification'
);


ALTER TYPE public.audit_entity_type OWNER TO ztap_user;

--
-- Name: event_type; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.event_type AS ENUM (
    'tournament',
    'friendly_match',
    'training_camp',
    'other'
);


ALTER TYPE public.event_type OWNER TO ztap_user;

--
-- Name: football_division; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.football_division AS ENUM (
    'Castle Lager Premier League',
    'Division One',
    'Division Two',
    'Division Three',
    'Academy League',
    'Women Premier League',
    'Other',
    'Unaffiliated'
);


ALTER TYPE public.football_division OWNER TO ztap_user;

--
-- Name: gender_category; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.gender_category AS ENUM (
    'male',
    'female',
    'mixed'
);


ALTER TYPE public.gender_category OWNER TO ztap_user;

--
-- Name: invitation_status; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.invitation_status AS ENUM (
    'pending',
    'accepted',
    'expired',
    'revoked'
);


ALTER TYPE public.invitation_status OWNER TO ztap_user;

--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.notification_channel AS ENUM (
    'in_app',
    'email',
    'sms'
);


ALTER TYPE public.notification_channel OWNER TO ztap_user;

--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'read'
);


ALTER TYPE public.notification_status OWNER TO ztap_user;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.notification_type AS ENUM (
    'account_pending_approval',
    'account_approved',
    'account_rejected',
    'account_suspended',
    'account_info_requested',
    'application_received',
    'application_approved',
    'application_rejected',
    'application_certificate_ready',
    'approval_new_in_queue',
    'approval_assigned_to_you',
    'approval_info_responded',
    'approval_overdue',
    'approval_decision_made',
    'information_requested',
    'information_response_received',
    'payment_confirmed',
    'payment_failed',
    'reminder_travel_approaching',
    'reminder_info_request_pending',
    'reminder_profile_incomplete',
    'system_announcement'
);


ALTER TYPE public.notification_type OWNER TO ztap_user;

--
-- Name: org_status; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.org_status AS ENUM (
    'incomplete',
    'pending_approval',
    'approved',
    'rejected',
    'suspended'
);


ALTER TYPE public.org_status OWNER TO ztap_user;

--
-- Name: org_type; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.org_type AS ENUM (
    'club',
    'individual',
    'academy',
    'high_school',
    'primary_school',
    'college_university',
    'company'
);


ALTER TYPE public.org_type OWNER TO ztap_user;

--
-- Name: priority_level; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.priority_level AS ENUM (
    'normal',
    'urgent'
);


ALTER TYPE public.priority_level OWNER TO ztap_user;

--
-- Name: rejection_reason_code; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.rejection_reason_code AS ENUM (
    'organisation_not_registered',
    'invalid_affiliation_number',
    'incomplete_documentation',
    'insufficient_documentation',
    'overage_players',
    'travel_dates_conflict',
    'tournament_not_recognised',
    'not_in_national_interest',
    'medical_clearance_missing',
    'insurance_missing',
    'passport_invalid',
    'visa_issues',
    'submitted_too_late',
    'destination_travel_advisory',
    'other'
);


ALTER TYPE public.rejection_reason_code OWNER TO ztap_user;

--
-- Name: tournament_name; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.tournament_name AS ENUM (
    'COSAFA Cup',
    'AFCON',
    'AFCON Qualification',
    'World Cup',
    'World Cup Qualification',
    'CAF Champions League',
    'CAF Confederation Cup',
    'SADC Schools Games',
    'FEASSSA Games',
    'Other'
);


ALTER TYPE public.tournament_name OWNER TO ztap_user;

--
-- Name: travel_mode; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.travel_mode AS ENUM (
    'air',
    'road',
    'both'
);


ALTER TYPE public.travel_mode OWNER TO ztap_user;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.user_role AS ENUM (
    'applicant',
    'reviewer',
    'supervisor',
    'system_admin'
);


ALTER TYPE public.user_role OWNER TO ztap_user;

--
-- Name: zimbabwe_sport; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.zimbabwe_sport AS ENUM (
    'cricket',
    'football',
    'rugby',
    'hockey',
    'tennis',
    'chess',
    'darts',
    'boxing',
    'karate',
    'athletics',
    'swimming',
    'netball',
    'golf',
    'basketball',
    'volleyball',
    'cycling',
    'motorsport'
);


ALTER TYPE public.zimbabwe_sport OWNER TO ztap_user;

--
-- Name: zw_province; Type: TYPE; Schema: public; Owner: ztap_user
--

CREATE TYPE public.zw_province AS ENUM (
    'Bulawayo',
    'Harare',
    'Manicaland',
    'Mashonaland Central',
    'Mashonaland East',
    'Mashonaland West',
    'Masvingo',
    'Matabeleland North',
    'Matabeleland South',
    'Midlands'
);


ALTER TYPE public.zw_province OWNER TO ztap_user;

--
-- Name: check_all_approved(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.check_all_approved() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    approved_count INTEGER;
BEGIN
    IF NEW.status != 'approved' THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO approved_count
    FROM approvals
    WHERE application_id = NEW.application_id
      AND status = 'approved';

    -- all 3 approved (including this one just updated)
    IF approved_count = 3 THEN
        UPDATE applications
        SET
            status     = 'approved',
            decided_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.application_id
          AND status NOT IN ('approved', 'certificate_issued', 'withdrawn');
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_all_approved() OWNER TO ztap_user;

--
-- Name: check_any_rejected(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.check_any_rejected() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE applications
        SET
            status     = 'rejected',
            decided_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.application_id
          AND status NOT IN ('rejected', 'approved', 'certificate_issued', 'withdrawn');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_any_rejected() OWNER TO ztap_user;

--
-- Name: create_approval_rows(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.create_approval_rows() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
        INSERT INTO approvals (application_id, body, status, sla_deadline)
        VALUES
            (NEW.id, 'ZIFA',        'pending', NOW() + INTERVAL '7 days'),
            (NEW.id, 'SRC',         'pending', NOW() + INTERVAL '7 days'),
            (NEW.id, 'IMMIGRATION', 'pending', NOW() + INTERVAL '7 days');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_approval_rows() OWNER TO ztap_user;

--
-- Name: expire_pending_invitations(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.expire_pending_invitations() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE invitations
    SET
        status     = 'expired',
        updated_at = NOW()
    WHERE
        status    = 'pending'
        AND expires_at < NOW();

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION public.expire_pending_invitations() OWNER TO ztap_user;

--
-- Name: generate_application_ref(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.generate_application_ref() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_year SMALLINT;
    next_seq     INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::SMALLINT;

    INSERT INTO application_sequences(year, last_seq)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
        SET last_seq = application_sequences.last_seq + 1
    RETURNING last_seq INTO next_seq;

    RETURN 'ZTA-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$;


ALTER FUNCTION public.generate_application_ref() OWNER TO ztap_user;

--
-- Name: generate_certificate_number(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.generate_certificate_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_year SMALLINT;
    next_seq     INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::SMALLINT;

    INSERT INTO certificate_sequences(year, last_seq)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
        SET last_seq = certificate_sequences.last_seq + 1
    RETURNING last_seq INTO next_seq;

    RETURN 'ZTA-CERT-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$;


ALTER FUNCTION public.generate_certificate_number() OWNER TO ztap_user;

--
-- Name: log_audit_event(uuid, character varying, public.user_role, public.approver_body, public.audit_entity_type, uuid, text, public.audit_action, text, uuid, jsonb, jsonb, jsonb, inet, text); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.log_audit_event(p_actor_id uuid, p_actor_name character varying, p_actor_role public.user_role, p_actor_body public.approver_body, p_entity_type public.audit_entity_type, p_entity_id uuid, p_entity_label text, p_action public.audit_action, p_description text, p_application_id uuid, p_old_values jsonb, p_new_values jsonb, p_meta jsonb, p_ip_address inet, p_request_id text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO audit_logs (
        actor_id, actor_name, actor_role, actor_body,
        entity_type, entity_id, entity_label,
        action, description,
        application_id,
        old_values, new_values, meta,
        ip_address, request_id
    ) VALUES (
        p_actor_id, p_actor_name, p_actor_role, p_actor_body,
        p_entity_type, p_entity_id, p_entity_label,
        p_action, p_description,
        p_application_id,
        p_old_values, p_new_values, p_meta,
        p_ip_address, p_request_id
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;


ALTER FUNCTION public.log_audit_event(p_actor_id uuid, p_actor_name character varying, p_actor_role public.user_role, p_actor_body public.approver_body, p_entity_type public.audit_entity_type, p_entity_id uuid, p_entity_label text, p_action public.audit_action, p_description text, p_application_id uuid, p_old_values jsonb, p_new_values jsonb, p_meta jsonb, p_ip_address inet, p_request_id text) OWNER TO ztap_user;

--
-- Name: manage_sla_clock(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.manage_sla_clock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Pausing: status moves to information_requested
    IF NEW.status = 'information_requested'
       AND OLD.status != 'information_requested' THEN
        NEW.sla_paused_at = NOW();
        NEW.sla_resumed_at = NULL;
    END IF;

    -- Resuming: status moves away from information_requested
    IF OLD.status = 'information_requested'
       AND NEW.status != 'information_requested' THEN
        NEW.sla_resumed_at = NOW();
        NEW.sla_pause_duration = COALESCE(NEW.sla_pause_duration, INTERVAL '0')
                                 + (NOW() - OLD.sla_paused_at);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.manage_sla_clock() OWNER TO ztap_user;

--
-- Name: mark_overdue_approvals(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.mark_overdue_approvals() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE approvals
    SET
        is_overdue = TRUE,
        updated_at = NOW()
    WHERE
        status NOT IN ('approved', 'rejected')
        AND sla_deadline IS NOT NULL
        AND (
            -- not paused
            sla_paused_at IS NULL
            AND NOW() > sla_deadline
        )
        AND is_overdue = FALSE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION public.mark_overdue_approvals() OWNER TO ztap_user;

--
-- Name: prevent_internal_note_deletes(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.prevent_internal_note_deletes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION
        'Internal notes cannot be deleted. Note id: %', OLD.id;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.prevent_internal_note_deletes() OWNER TO ztap_user;

--
-- Name: prevent_internal_note_edits(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.prevent_internal_note_edits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- only is_pinned is allowed to change
    IF  NEW.application_id  != OLD.application_id  OR
        NEW.approval_id     != OLD.approval_id     OR
        NEW.author_id       != OLD.author_id       OR
        NEW.author_name     != OLD.author_name     OR
        NEW.author_role     != OLD.author_role     OR
        NEW.body            != OLD.body            OR
        NEW.note            != OLD.note            OR
        NEW.created_at      != OLD.created_at
    THEN
        RAISE EXCEPTION
            'Internal notes are append-only. Only is_pinned may be changed. Note id: %', OLD.id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_internal_note_edits() OWNER TO ztap_user;

--
-- Name: prevent_submitted_edits(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.prevent_submitted_edits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status NOT IN ('draft', 'awaiting_payment') THEN
        -- allow only these columns to change post-submission
        IF  NEW.event_type              != OLD.event_type              OR
            NEW.tournament_name         IS DISTINCT FROM OLD.tournament_name OR
            NEW.tournament_name_other   IS DISTINCT FROM OLD.tournament_name_other OR
            NEW.opponent_team_name      IS DISTINCT FROM OLD.opponent_team_name OR
            NEW.opponent_team_country   IS DISTINCT FROM OLD.opponent_team_country OR
            NEW.training_facility_name  IS DISTINCT FROM OLD.training_facility_name OR
            NEW.training_camp_objective IS DISTINCT FROM OLD.training_camp_objective OR
            NEW.event_description       IS DISTINCT FROM OLD.event_description OR
            NEW.event_display_name      != OLD.event_display_name OR
            NEW.host_country            != OLD.host_country OR
            NEW.host_city               IS DISTINCT FROM OLD.host_city OR
            NEW.departure_date          != OLD.departure_date OR
            NEW.return_date             != OLD.return_date OR
            NEW.player_count            != OLD.player_count OR
            NEW.officials_count         != OLD.officials_count OR
            NEW.age_group               != OLD.age_group OR
            NEW.gender_category         != OLD.gender_category OR
            NEW.travel_mode             != OLD.travel_mode
        THEN
            RAISE EXCEPTION
                'Application % cannot be edited after submission. Current status: %',
                OLD.reference_number, OLD.status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_submitted_edits() OWNER TO ztap_user;

--
-- Name: set_submitted_at(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.set_submitted_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
        NEW.submitted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_submitted_at() OWNER TO ztap_user;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO ztap_user;

--
-- Name: stamp_notification_read_at(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.stamp_notification_read_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at  = NOW();
        NEW.status   = 'read';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.stamp_notification_read_at() OWNER TO ztap_user;

--
-- Name: sync_application_under_review(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.sync_application_under_review() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'under_review' AND OLD.status = 'pending' THEN
        UPDATE applications
        SET
            status          = 'under_review',
            first_opened_at = COALESCE(first_opened_at, NOW()),
            updated_at      = NOW()
        WHERE id = NEW.application_id
          AND status = 'submitted';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_application_under_review() OWNER TO ztap_user;

--
-- Name: sync_certificate_issued(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.sync_certificate_issued() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE applications
    SET
        status     = 'certificate_issued',
        updated_at = NOW()
    WHERE id = NEW.application_id
      AND status = 'approved';

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_certificate_issued() OWNER TO ztap_user;

--
-- Name: sync_org_status_to_user(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.sync_org_status_to_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE users
        SET status = 'active', updated_at = NOW()
        WHERE id = NEW.user_id AND role = 'applicant';

    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE users
        SET status = 'rejected', updated_at = NOW()
        WHERE id = NEW.user_id AND role = 'applicant';

    ELSIF NEW.status = 'suspended' AND OLD.status != 'suspended' THEN
        UPDATE users
        SET status = 'suspended', updated_at = NOW()
        WHERE id = NEW.user_id AND role = 'applicant';

    ELSIF NEW.status = 'pending_approval' AND OLD.status != 'pending_approval' THEN
        UPDATE users
        SET status = 'pending_approval', updated_at = NOW()
        WHERE id = NEW.user_id AND role = 'applicant';

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_org_status_to_user() OWNER TO ztap_user;

--
-- Name: validate_certificate_insert(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.validate_certificate_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    app_status application_status;
BEGIN
    SELECT status INTO app_status
    FROM applications
    WHERE id = NEW.application_id;

    IF app_status != 'approved' THEN
        RAISE EXCEPTION
            'Cannot issue certificate for application % with status: %',
            NEW.application_id, app_status;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_certificate_insert() OWNER TO ztap_user;

--
-- Name: validate_invitation_acceptance(); Type: FUNCTION; Schema: public; Owner: ztap_user
--

CREATE FUNCTION public.validate_invitation_acceptance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        IF OLD.status = 'revoked' THEN
            RAISE EXCEPTION 'Invitation % has been revoked and cannot be accepted', OLD.id;
        END IF;

        IF OLD.status = 'expired' THEN
            RAISE EXCEPTION 'Invitation % has expired and cannot be accepted', OLD.id;
        END IF;

        IF OLD.expires_at < NOW() THEN
            RAISE EXCEPTION 'Invitation % expired at % and cannot be accepted', OLD.id, OLD.expires_at;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_invitation_acceptance() OWNER TO ztap_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: application_sequences; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.application_sequences (
    year smallint NOT NULL,
    last_seq integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.application_sequences OWNER TO ztap_user;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference_number text DEFAULT public.generate_application_ref() NOT NULL,
    applicant_id uuid NOT NULL,
    organisation_id uuid NOT NULL,
    status public.application_status DEFAULT 'draft'::public.application_status NOT NULL,
    priority public.priority_level DEFAULT 'normal'::public.priority_level NOT NULL,
    priority_reason text,
    event_type public.event_type NOT NULL,
    tournament_name public.tournament_name,
    tournament_name_other character varying(255),
    opponent_team_name character varying(255),
    opponent_team_country character varying(100),
    training_facility_name character varying(255),
    training_camp_objective text,
    event_description text,
    event_display_name character varying(255) NOT NULL,
    host_country character varying(100) NOT NULL,
    host_city character varying(100),
    port_of_entry character varying(150),
    port_of_exit character varying(150),
    departure_date date NOT NULL,
    return_date date NOT NULL,
    player_count smallint NOT NULL,
    officials_count smallint DEFAULT 0 NOT NULL,
    total_travellers smallint GENERATED ALWAYS AS ((player_count + officials_count)) STORED,
    age_group public.age_group NOT NULL,
    gender_category public.gender_category NOT NULL,
    travel_mode public.travel_mode NOT NULL,
    emergency_contact_name character varying(255),
    emergency_contact_mobile character varying(20),
    emergency_contact_relation character varying(100),
    declaration_accepted boolean DEFAULT false NOT NULL,
    declaration_accepted_at timestamp with time zone,
    declaration_ip inet,
    withdrawn_at timestamp with time zone,
    withdrawn_by uuid,
    withdrawal_reason text,
    flagged boolean DEFAULT false NOT NULL,
    flagged_reason text,
    flagged_by uuid,
    flagged_at timestamp with time zone,
    submitted_at timestamp with time zone,
    first_opened_at timestamp with time zone,
    decided_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    support_documents character varying(255),
    travel_documents character varying(255),
    organisation_name character varying(255),
    sport character varying(255),
    CONSTRAINT applications_officials_count_check CHECK (((officials_count >= 0) AND (officials_count <= 50))),
    CONSTRAINT applications_player_count_check CHECK (((player_count >= 1) AND (player_count <= 100))),
    CONSTRAINT departure_in_future CHECK (((status = 'draft'::public.application_status) OR (departure_date >= (CURRENT_DATE - '1 day'::interval))))
);


ALTER TABLE public.applications OWNER TO ztap_user;

--
-- Name: approvals; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    body public.approver_body NOT NULL,
    assigned_to uuid,
    assigned_at timestamp with time zone,
    assigned_by uuid,
    status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    sla_deadline timestamp with time zone,
    sla_paused_at timestamp with time zone,
    sla_resumed_at timestamp with time zone,
    sla_pause_duration interval,
    is_overdue boolean DEFAULT false NOT NULL,
    first_opened_at timestamp with time zone,
    first_opened_by uuid,
    decided_at timestamp with time zone,
    decided_by uuid,
    decision_note text,
    rejection_reason_code public.rejection_reason_code,
    rejection_reason_detail text,
    overridden boolean DEFAULT false NOT NULL,
    overridden_by uuid,
    overridden_at timestamp with time zone,
    override_note text,
    original_status public.approval_status,
    original_decided_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.approvals OWNER TO ztap_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    actor_name character varying(255),
    actor_role public.user_role,
    actor_body public.approver_body,
    entity_type public.audit_entity_type NOT NULL,
    entity_id uuid NOT NULL,
    entity_label text,
    action public.audit_action NOT NULL,
    description text,
    application_id uuid,
    old_values jsonb,
    new_values jsonb,
    meta jsonb,
    ip_address inet,
    user_agent text,
    request_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO ztap_user;

--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ip inet
);


ALTER TABLE public.auth_sessions OWNER TO ztap_user;

--
-- Name: certificate_sequences; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.certificate_sequences (
    year smallint NOT NULL,
    last_seq integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.certificate_sequences OWNER TO ztap_user;

--
-- Name: certificates; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    certificate_number text DEFAULT public.generate_certificate_number() NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size_bytes integer,
    mime_type character varying(100) DEFAULT 'application/pdf'::character varying NOT NULL,
    issued_by uuid,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date NOT NULL,
    valid_until date NOT NULL,
    is_revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    revoked_by uuid,
    revocation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_name character varying(200),
    CONSTRAINT revocation_fields_consistent CHECK (((is_revoked = false) OR ((revoked_at IS NOT NULL) AND (revoked_by IS NOT NULL) AND (revocation_reason IS NOT NULL)))),
    CONSTRAINT valid_certificate_dates CHECK ((valid_until >= valid_from))
);


ALTER TABLE public.certificates OWNER TO ztap_user;

--
-- Name: internal_notes; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.internal_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    approval_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_name character varying(255) NOT NULL,
    author_role public.user_role NOT NULL,
    body public.approver_body NOT NULL,
    note text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT note_max_length CHECK ((length(note) <= 5000)),
    CONSTRAINT note_not_empty CHECK ((length(TRIM(BOTH FROM note)) > 0))
);


ALTER TABLE public.internal_notes OWNER TO ztap_user;

--
-- Name: invitations; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    body public.approver_body,
    job_title character varying(150),
    department character varying(150),
    staff_number character varying(50),
    token text NOT NULL,
    token_hash text NOT NULL,
    status public.invitation_status DEFAULT 'pending'::public.invitation_status NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    invited_by uuid NOT NULL,
    personal_note text,
    accepted_at timestamp with time zone,
    accepted_by_user_id uuid,
    revoked_at timestamp with time zone,
    revoked_by uuid,
    revocation_reason text,
    resend_count smallint DEFAULT 0 NOT NULL,
    last_resent_at timestamp with time zone,
    last_resent_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acceptance_fields_consistent CHECK ((((accepted_at IS NULL) AND (accepted_by_user_id IS NULL)) OR ((accepted_at IS NOT NULL) AND (accepted_by_user_id IS NOT NULL)))),
    CONSTRAINT approver_invite_requires_body CHECK (((role <> ALL (ARRAY['reviewer'::public.user_role, 'supervisor'::public.user_role])) OR (body IS NOT NULL))),
    CONSTRAINT no_accept_after_expiry CHECK (((accepted_at IS NULL) OR (accepted_at <= expires_at))),
    CONSTRAINT revocation_fields_consistent CHECK (((status <> 'revoked'::public.invitation_status) OR ((revoked_at IS NOT NULL) AND (revoked_by IS NOT NULL))))
);


ALTER TABLE public.invitations OWNER TO ztap_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    application_id uuid,
    entity_type text,
    entity_id uuid,
    type public.notification_type NOT NULL,
    channel public.notification_channel DEFAULT 'in_app'::public.notification_channel NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    action_url text,
    action_label character varying(100),
    status public.notification_status DEFAULT 'pending'::public.notification_status NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    sent_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    retry_count smallint DEFAULT 0 NOT NULL,
    next_retry_at timestamp with time zone,
    idempotency_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO ztap_user;

--
-- Name: organisations; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.organisations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    org_name character varying(255) NOT NULL,
    org_type public.org_type NOT NULL,
    establishment_date date,
    website character varying(255),
    division public.football_division,
    is_zifa_registered boolean DEFAULT false NOT NULL,
    zifa_affiliation_number character varying(100),
    moe_registration_number character varying(100),
    principal_name character varying(255),
    is_official_school_sport boolean,
    physical_address text NOT NULL,
    city character varying(100) NOT NULL,
    province public.zw_province NOT NULL,
    primary_contact_name character varying(255) NOT NULL,
    primary_contact_title character varying(150),
    primary_contact_mobile character varying(20) NOT NULL,
    primary_contact_email character varying(255) NOT NULL,
    secondary_contact_name character varying(255),
    secondary_contact_title character varying(150),
    secondary_contact_mobile character varying(20),
    secondary_contact_email character varying(255),
    emergency_contact_name character varying(255),
    emergency_contact_mobile character varying(20),
    emergency_contact_relation character varying(100),
    status public.org_status DEFAULT 'incomplete'::public.org_status NOT NULL,
    profile_submitted_at timestamp with time zone,
    profile_submission_count smallint DEFAULT 0 NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    admin_notes text,
    suspension_reason text,
    info_requested boolean DEFAULT false NOT NULL,
    info_request_message text,
    info_requested_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sport public.zimbabwe_sport
);


ALTER TABLE public.organisations OWNER TO ztap_user;

--
-- Name: sport_body; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.sport_body (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    sport_type public.zimbabwe_sport NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    short_name character varying(255)
);


ALTER TABLE public.sport_body OWNER TO ztap_user;

--
-- Name: sport_body_id_seq; Type: SEQUENCE; Schema: public; Owner: ztap_user
--

CREATE SEQUENCE public.sport_body_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sport_body_id_seq OWNER TO ztap_user;

--
-- Name: sport_body_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ztap_user
--

ALTER SEQUENCE public.sport_body_id_seq OWNED BY public.sport_body.id;


--
-- Name: travel_personnel; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.travel_personnel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    gender character varying(10) NOT NULL,
    date_of_birth date NOT NULL,
    national_id_number character varying(50),
    passport_number character varying(50),
    passport_expiry date,
    role character varying(50) NOT NULL,
    "position" character varying(50),
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.travel_personnel OWNER TO ztap_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: ztap_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    full_name character varying(255) NOT NULL,
    mobile_number character varying(20),
    role public.user_role DEFAULT 'applicant'::public.user_role NOT NULL,
    body public.approver_body,
    status public.account_status DEFAULT 'pending_profile'::public.account_status NOT NULL,
    status_reason text,
    email_verified boolean DEFAULT false NOT NULL,
    email_verified_at timestamp with time zone,
    email_verify_token text,
    email_verify_token_expires timestamp with time zone,
    password_reset_token text,
    password_reset_token_expires timestamp with time zone,
    password_changed_at timestamp with time zone,
    last_login_at timestamp with time zone,
    last_login_ip inet,
    failed_login_attempts smallint DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    activated_at timestamp with time zone,
    activated_by uuid,
    deactivated_at timestamp with time zone,
    deactivated_by uuid,
    invited_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sports_body integer,
    CONSTRAINT approver_requires_body CHECK ((((role = ANY (ARRAY['reviewer'::public.user_role, 'supervisor'::public.user_role])) AND (body IS NOT NULL)) OR (role <> ALL (ARRAY['reviewer'::public.user_role, 'supervisor'::public.user_role])))),
    CONSTRAINT email_verify_token_expiry CHECK (((email_verify_token IS NULL) OR (email_verify_token_expires IS NOT NULL))),
    CONSTRAINT reset_token_expiry CHECK (((password_reset_token IS NULL) OR (password_reset_token_expires IS NOT NULL)))
);


ALTER TABLE public.users OWNER TO ztap_user;

--
-- Name: sport_body id; Type: DEFAULT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.sport_body ALTER COLUMN id SET DEFAULT nextval('public.sport_body_id_seq'::regclass);


--
-- Data for Name: application_sequences; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.application_sequences (year, last_seq) FROM stdin;
2026	5
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.applications (id, reference_number, applicant_id, organisation_id, status, priority, priority_reason, event_type, tournament_name, tournament_name_other, opponent_team_name, opponent_team_country, training_facility_name, training_camp_objective, event_description, event_display_name, host_country, host_city, port_of_entry, port_of_exit, departure_date, return_date, player_count, officials_count, age_group, gender_category, travel_mode, emergency_contact_name, emergency_contact_mobile, emergency_contact_relation, declaration_accepted, declaration_accepted_at, declaration_ip, withdrawn_at, withdrawn_by, withdrawal_reason, flagged, flagged_reason, flagged_by, flagged_at, submitted_at, first_opened_at, decided_at, deleted_at, deleted_by, created_at, updated_at, support_documents, travel_documents, organisation_name, sport) FROM stdin;
a068bba5-79ea-454c-878b-cce8f71cc439	ZTA-2026-0005	29e4abd0-9d43-49ff-98c5-4558a8f18601	1bc1db23-259a-465f-8a3c-6347fe1c1803	awaiting_body	normal	\N	friendly_match	COSAFA Cup	\N	\N	\N	\N	\N	\N	COSAFA Cup — South Africa	South Africa	Nelson Mandela	Robert Mugabe Stadium	Robert Mugabe Stadium	2026-04-17	2026-04-30	2	2	senior	male	air	\N	\N	\N	t	\N	127.0.0.1	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 07:32:26.284985+00	2026-04-15 11:11:32.841216+00	upload_zfta_docs/a79cf1b4ff615bf9881912dd090c4ab7-20260415073226.pdf	upload_zfta_docs/2f4e8348b92f52f6485bddd69113e312-20260415073226.pdf	\N	football
\.


--
-- Data for Name: approvals; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.approvals (id, application_id, body, assigned_to, assigned_at, assigned_by, status, sla_deadline, sla_paused_at, sla_resumed_at, sla_pause_duration, is_overdue, first_opened_at, first_opened_by, decided_at, decided_by, decision_note, rejection_reason_code, rejection_reason_detail, overridden, overridden_by, overridden_at, override_note, original_status, original_decided_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.audit_logs (id, actor_id, actor_name, actor_role, actor_body, entity_type, entity_id, entity_label, action, description, application_id, old_values, new_values, meta, ip_address, user_agent, request_id, created_at) FROM stdin;
\.


--
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.auth_sessions (id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, ip) FROM stdin;
b43c272e-9a94-43f9-9abe-e52507282768	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	2380834415d5d455179da48211ddad6fb7bf135dcc17f2fc921df3ce564df62d	2026-04-20 09:45:25.574881+00	\N	2026-03-21 09:45:25.575226+00	127.0.0.1
df78840f-7db3-4f04-b8fd-58e76c657f2a	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	743663a2ecadb99b63170b0e0023c9ce4391d62c9d99ed724062e1b4003aaa58	2026-04-20 09:50:48.795713+00	2026-03-21 10:23:28.802512+00	2026-03-21 09:50:48.795828+00	127.0.0.1
da793b36-5efe-4086-9959-9de2814ea43b	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	9d0637306896f5ed6869d4826ff7e26d764d2b5ab790fd42d8361ac8e2602fa3	2026-04-20 14:51:11.458683+00	\N	2026-03-21 14:51:11.45922+00	127.0.0.1
57d6c83f-f4b9-4c38-bf1e-055cba66b2cb	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	1d6eb6269cf884304720f6002ebade75e683eeb00102c95daeefa298454c8a8f	2026-04-20 15:09:31.723465+00	2026-03-21 15:13:48.656328+00	2026-03-21 15:09:31.724024+00	127.0.0.1
ab6c8b29-7a53-48c4-812f-7d3f16d5c49c	29e4abd0-9d43-49ff-98c5-4558a8f18601	8ae1cd719b1828aa3a0f220bc698448b3d85c2f2f982ac48e4fc96e9199c3136	2026-04-20 15:14:09.945412+00	2026-03-21 15:21:42.771227+00	2026-03-21 15:14:09.945444+00	127.0.0.1
88cad7b5-f8fa-46d0-9b19-ec068633d98e	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	f3977be3c02497f1bad05fba9531560c466fdb3d4bae2c1b7ff4872655da9efc	2026-04-20 15:23:35.620786+00	2026-03-21 15:23:54.16455+00	2026-03-21 15:23:35.621016+00	127.0.0.1
57483b1a-1433-4464-ba2d-861694e35a74	29e4abd0-9d43-49ff-98c5-4558a8f18601	e5781a324b23a6b8d31400f74b7c0e67341a57e8049bccf746cd7bc28ba1de75	2026-04-20 15:24:10.108251+00	2026-03-21 15:35:38.014285+00	2026-03-21 15:24:10.108294+00	127.0.0.1
fc026702-cf85-4a5c-ad22-5a682f10df9b	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	fe1505dbe125ffa5d391f267a30dc559997619d2849f667f186829a373a1427e	2026-04-20 15:35:59.752409+00	\N	2026-03-21 15:35:59.752838+00	127.0.0.1
47ceccab-c2a1-4ba4-aa53-cdd75e8f0003	29e4abd0-9d43-49ff-98c5-4558a8f18601	a9c8487a8661e7b0f774a94e53eb50e4e8a4e9002d558da29d1ce00741aea293	2026-04-20 15:58:54.236323+00	\N	2026-03-21 15:58:54.236436+00	127.0.0.1
bee9d628-e8d4-4536-8803-63d01c43c037	29e4abd0-9d43-49ff-98c5-4558a8f18601	5e8b28a5454f5c4ef4dc65826805b273a7bc7829fcba798a19ef2c7d19abc8ad	2026-04-20 15:59:57.712533+00	\N	2026-03-21 15:59:57.71262+00	127.0.0.1
cf6428eb-5838-4120-80b6-d4ac8a613a0f	29e4abd0-9d43-49ff-98c5-4558a8f18601	b2237dd780db8b6a48932b0b29fae3bc776d09e7d1af4e5b47aa0dd57a4d21ee	2026-04-20 16:07:48.377654+00	\N	2026-03-21 16:07:48.377936+00	127.0.0.1
69d3d5fc-6092-4843-acfc-cc372dc9a88e	29e4abd0-9d43-49ff-98c5-4558a8f18601	c96c49eec1a158ab1340abc1a91bb1ca44b3b943a9b57b091d978d38f583de35	2026-04-20 17:40:37.850824+00	2026-03-21 17:40:54.399162+00	2026-03-21 17:40:37.851136+00	127.0.0.1
6b25a2e7-42b8-4f36-84da-febf230558d6	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	2c316a388291cbba31377f0ba1eb6218ba66bec2ff53f946c764c2e92e334cd7	2026-04-20 17:41:28.424419+00	2026-03-21 17:54:06.83098+00	2026-03-21 17:41:28.424597+00	127.0.0.1
46b1d7e5-693c-43b9-88ba-56b1e4dee15f	29e4abd0-9d43-49ff-98c5-4558a8f18601	17eea0b92ce5e434201b8f4e13df11195788535474f42c975a04737d288c1a76	2026-04-20 17:57:56.831562+00	\N	2026-03-21 17:57:56.83183+00	127.0.0.1
f24174a0-9de4-439d-961d-69718e212388	bfb911f9-7d81-467d-a264-82f659994912	5cb8ca992d37ac29973eb3f0a52648c3dbd73b9e6697e621b2baa0ce0ff8c26b	2026-04-20 18:03:54.978538+00	\N	2026-03-21 18:03:54.978939+00	127.0.0.1
fc48f6fe-48c5-4f4f-8f18-9883c11ebc48	29e4abd0-9d43-49ff-98c5-4558a8f18601	edc84f93643244c3123bc75455c3dc2de3fa1e69afb95dcbe47ddf129fb71b37	2026-04-20 20:15:53.168436+00	\N	2026-03-21 20:15:53.168889+00	127.0.0.1
dfea0cc9-01aa-4ad6-8a0d-36f7b7099ad8	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	833e3168ea11464f2ca0b2acd1cb19a48fa7c4ad0ac051f48f2b24dcdb4d8942	2026-04-21 07:14:26.870386+00	2026-03-22 07:14:40.798309+00	2026-03-22 07:14:26.870705+00	127.0.0.1
2d696d95-d5f0-4aba-8060-70c1f62deeac	29e4abd0-9d43-49ff-98c5-4558a8f18601	5beca825cee8c2fba57d532fbcfdcc7541716dcc34cf40b6260e17d9cff60964	2026-04-21 07:14:58.056397+00	\N	2026-03-22 07:14:58.056498+00	127.0.0.1
6e7472c2-1c8d-42fa-b956-aaff9f68db3c	29e4abd0-9d43-49ff-98c5-4558a8f18601	aaf33707ebfc442e9cbcb69cc045a18fb546eb0169b26f1620f70bd20e2d1b6f	2026-04-21 11:17:36.634486+00	2026-03-22 11:17:42.865389+00	2026-03-22 11:17:36.634922+00	127.0.0.1
1db7483b-af77-4e1d-b210-adea0b57698f	bfb911f9-7d81-467d-a264-82f659994912	6fb50937dc27ad55022ef2058af94f0893531e40fea4c65b6453c14fd30e6660	2026-04-21 12:07:20.057928+00	2026-03-22 13:57:27.437305+00	2026-03-22 12:07:20.05824+00	127.0.0.1
f11ccc4d-b0fd-47a7-8bb6-4cfe42913ab6	bfb911f9-7d81-467d-a264-82f659994912	68dd046cd0e4c66d64f93ce7129189156cb335cb9bc2586543df521163505c22	2026-04-21 13:57:38.329712+00	2026-03-22 14:04:27.137511+00	2026-03-22 13:57:38.330078+00	127.0.0.1
df450bb7-a3d1-4d87-9006-22eee5fbee06	bfb911f9-7d81-467d-a264-82f659994912	7e89e9a44e4253f3bab7e7f21a2e92c18a8b2b8b3808a34625ed5cdc9db2371a	2026-04-21 14:04:40.343445+00	\N	2026-03-22 14:04:40.34391+00	127.0.0.1
dd4a1ac4-3556-47ac-bdf9-f90cfc61a5ae	29e4abd0-9d43-49ff-98c5-4558a8f18601	4809ca86546545b07b52a853b492b7fe7568aa9a8f75a957748742d0ae8759a8	2026-04-21 15:11:46.694515+00	2026-03-22 15:55:16.026552+00	2026-03-22 15:11:46.6947+00	127.0.0.1
da3d28ea-42e6-490d-8342-1f9cde066150	521a4f80-b132-4864-89ba-3e38d6af74f9	7e9c3136d9271277454e8e352cb4f4a1e836d007b45518f2ec99e05bb7d4228a	2026-04-21 15:58:48.281745+00	\N	2026-03-22 15:58:48.282136+00	127.0.0.1
333f78b6-e469-44f5-85a6-3f1f530cf7c3	bfb911f9-7d81-467d-a264-82f659994912	3dd18fdee4d92150410326ad4a443fe3c2b89ebbad95503f6d3e65ecdd68cfb9	2026-04-21 16:03:13.046205+00	2026-03-22 16:18:05.90726+00	2026-03-22 16:03:13.046638+00	127.0.0.1
c5974360-57b8-4386-96d5-2669186f64c8	521a4f80-b132-4864-89ba-3e38d6af74f9	b4a17f7a586c1aee4425d83ab555f96c67a0b86ac4d7d7834e2672be04fa7ec2	2026-04-21 16:18:29.587013+00	2026-03-22 18:41:27.471075+00	2026-03-22 16:18:29.587537+00	127.0.0.1
90b21d94-e263-4541-ad4d-ced165ae0bfc	54c01d73-1045-46d7-8f71-21cda52502d5	3869874ac7c1cd327dc50ba37269930e613fc3e9b178c046a90ed58b5d7f1115	2026-04-21 18:46:07.388966+00	2026-03-22 19:00:44.11655+00	2026-03-22 18:46:07.389357+00	127.0.0.1
c1b18213-841a-490d-a193-0cd38ad4acbe	29e4abd0-9d43-49ff-98c5-4558a8f18601	8c7b1dc408857e77743bd5586c6f57b776758e99bb2e6e92e9e9b7b8df67bc0c	2026-04-21 19:05:03.227329+00	\N	2026-03-22 19:05:03.227448+00	127.0.0.1
9479ea34-53ea-4b88-827f-d24be20f56d0	29e4abd0-9d43-49ff-98c5-4558a8f18601	11e394f4fb87e78c8e3484a6af470452647e1f754e541e6ba261b6647c8e9c70	2026-04-21 20:28:33.747291+00	\N	2026-03-22 20:28:33.74747+00	127.0.0.1
e8857a61-979f-4dbb-9d59-82a9a519534d	29e4abd0-9d43-49ff-98c5-4558a8f18601	062bf8d8833f8f661cac8330486416df4c5e8198274491b0d84f1c161c3ffafc	2026-04-22 06:12:28.178955+00	2026-03-23 06:31:12.769869+00	2026-03-23 06:12:28.179435+00	127.0.0.1
45415b23-5ac0-4bcd-b46f-eb121588eebc	bfb911f9-7d81-467d-a264-82f659994912	42a62e4a0146edd440488ca4ac4f1369dd3e610d01f7cd4b721c7a4e5c1a4ff7	2026-04-22 06:31:46.572111+00	2026-03-23 06:45:57.358937+00	2026-03-23 06:31:46.572351+00	127.0.0.1
a0a12531-514a-40c5-bb92-82f990ab7c2d	521a4f80-b132-4864-89ba-3e38d6af74f9	9b508c2c151b8454c86d60288a3be48e8099b004ceb10edd9b45b7e76d360fd2	2026-04-22 06:47:49.077161+00	2026-03-23 06:55:40.585506+00	2026-03-23 06:47:49.077463+00	127.0.0.1
2d14f873-a018-4197-8935-b6b4472ff976	54c01d73-1045-46d7-8f71-21cda52502d5	e8aaf1100dc90c10ad4e5da91dd030a9dd9340f7b586a4ff9f124e9b683f4e1a	2026-04-22 06:56:51.984704+00	2026-03-23 06:57:22.57507+00	2026-03-23 06:56:51.984867+00	127.0.0.1
a3ce200f-1ee1-4e26-b0c5-3f29d718a17c	29e4abd0-9d43-49ff-98c5-4558a8f18601	65b9b130e00365a1bbaf20d3422b47d7be80cebb071fd1079610cbe149131830	2026-04-22 06:57:46.436787+00	\N	2026-03-23 06:57:46.437063+00	127.0.0.1
5e0124a6-b017-48ba-9036-e2a5f5cf554d	29e4abd0-9d43-49ff-98c5-4558a8f18601	b05f2321eaa486b6a226a8dce31715a8e4b3d98fe19379728d125639ac6e17a6	2026-04-23 10:05:50.924605+00	\N	2026-03-24 10:05:50.924982+00	127.0.0.1
ca26a87e-a771-42c2-8ad0-608024afb052	29e4abd0-9d43-49ff-98c5-4558a8f18601	15cb8703a9c5c745dcb193fed52bf822bd5ef05cee711549fb8e33be49244941	2026-04-23 10:10:50.138404+00	\N	2026-03-24 10:10:50.138837+00	127.0.0.1
21110d57-85a1-4805-b91a-8a3b3d97adcd	29e4abd0-9d43-49ff-98c5-4558a8f18601	0b3544ccf58f9edf27a9f4ecf28e37c01752b6f58025cb74277de0e7b749d9d5	2026-04-23 10:14:53.410711+00	2026-03-24 10:20:32.224354+00	2026-03-24 10:14:53.411202+00	127.0.0.1
588dcec8-28a4-4af0-91eb-8730d85bd65f	29e4abd0-9d43-49ff-98c5-4558a8f18601	d2a38b454a9fbe6814d02381776db9403e9aad4e5ce1eadfc4438c0093c02e72	2026-04-23 10:22:43.481818+00	\N	2026-03-24 10:22:43.482142+00	127.0.0.1
d9b672f7-945f-4b87-a723-a8c4683d72ac	521a4f80-b132-4864-89ba-3e38d6af74f9	5915b616bf1bd9adfe593a021214a31d9f4123be4b531a549290248d1c799703	2026-04-23 10:25:18.087406+00	\N	2026-03-24 10:25:18.087466+00	127.0.0.1
f8bc878c-b247-4b34-b3e7-0f44058f3b37	bfb911f9-7d81-467d-a264-82f659994912	0792bfc016a121884a2004b93955bba0f3019a8641cb63d6dbe395b49f5f62de	2026-04-23 10:20:57.917812+00	2026-03-24 10:26:43.598237+00	2026-03-24 10:20:57.917918+00	127.0.0.1
9d7a0cb3-d8a3-4b61-8f43-b45a5056cf63	54c01d73-1045-46d7-8f71-21cda52502d5	f1ac33ab0f511f24a5eeeb77f5cc00721a46985605713a8a52f962fa519fbc8c	2026-04-23 10:27:32.452356+00	\N	2026-03-24 10:27:32.452519+00	127.0.0.1
8160b79b-8765-44cc-899e-76c7fdb8db3c	29e4abd0-9d43-49ff-98c5-4558a8f18601	d73f1ad05bf14767dfc2cadfb49bb01acc4cf86c98f53dc0f0212923473fd74a	2026-04-24 17:53:53.450451+00	2026-03-25 17:54:03.650819+00	2026-03-25 17:53:53.450873+00	127.0.0.1
c4d64ab8-64f8-4b8c-9c54-bf39f000473e	29e4abd0-9d43-49ff-98c5-4558a8f18601	a546f6221577ff4395ac65d6713ee1c1ac51d76e561b6cf39fbf4f0f7d316459	2026-04-24 17:55:18.29561+00	\N	2026-03-25 17:55:18.295766+00	127.0.0.1
ce43219f-6074-49d4-8db5-31cd578d3597	29e4abd0-9d43-49ff-98c5-4558a8f18601	bd41f9d97b0e31e228fc31bbb6fa6610ea624335c0270a5d6ffa304a6bd37576	2026-04-24 19:35:19.292664+00	2026-03-25 19:40:32.935398+00	2026-03-25 19:35:19.293159+00	127.0.0.1
ddbe2a3c-4e7e-430c-9bcb-63f69e5946e0	bfb911f9-7d81-467d-a264-82f659994912	5510b7b3987e60b83893164c09c4333bb7351b8e7dc62514d4504d41aa5dca22	2026-04-24 19:40:54.852948+00	2026-03-25 19:42:24.309373+00	2026-03-25 19:40:54.853323+00	127.0.0.1
aa0ef212-c56c-4ec4-a05c-6ee43a2bbf77	29e4abd0-9d43-49ff-98c5-4558a8f18601	b3979852bc01b435813f1e23ed383fe0a03f81963b8a0e4f9cbc09f73c3a0af2	2026-04-24 19:42:28.347528+00	\N	2026-03-25 19:42:28.347983+00	127.0.0.1
2956c336-4076-494e-8af7-9a1997118ae6	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	138c1d687ef00df778ecf9cb236aa50af118136f6914239fe3216c8fc65d29c5	2026-04-29 16:41:13.25822+00	\N	2026-03-30 16:41:13.258723+00	127.0.0.1
354448bd-3eca-4f1b-8ea9-e06084eeffc3	29e4abd0-9d43-49ff-98c5-4558a8f18601	5a19de5c6ce23de79524de3b770b0d7f1aa5912f735e6648a6dbca352d522544	2026-04-30 09:05:07.41022+00	\N	2026-03-31 09:05:07.41073+00	127.0.0.1
51c46194-8e19-4073-8121-3c3fa426614d	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	d07c7861d54c02544f8ec660934005439d8f31a487bf7baf4a1487bd7a8c0f96	2026-05-09 10:23:33.326307+00	2026-04-09 10:23:47.409812+00	2026-04-09 10:23:33.326678+00	127.0.0.1
dd137d08-e565-4edc-a7ca-339c1756acfb	29e4abd0-9d43-49ff-98c5-4558a8f18601	ba062f406eb11333a392195eec0b8735341cb7df050c51fa56f7d94421176786	2026-05-09 10:24:07.22583+00	2026-04-09 19:33:11.839927+00	2026-04-09 10:24:07.226027+00	127.0.0.1
7eaaa500-6f1d-478c-afcc-ecad9c21bbf5	29e4abd0-9d43-49ff-98c5-4558a8f18601	c91ec367ad252312d21722869fcdd1b3cfc073b37f9725d2365136ef29d85098	2026-05-09 19:33:43.356614+00	2026-04-09 19:34:08.893151+00	2026-04-09 19:33:43.35681+00	127.0.0.1
8f616b30-c244-4031-a19c-372d04981042	29e4abd0-9d43-49ff-98c5-4558a8f18601	5258ef19dd5e040c186e88d5cf819bf8658180d04dc114089e9c02225d73d537	2026-05-09 19:34:30.679103+00	\N	2026-04-09 19:34:30.679191+00	127.0.0.1
ee45cb38-cc6d-4f60-b185-40542eac41a1	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	6f51881caf6aa4bd0054ec2efdd28c773d87f9afc3ddecb8660b673e4bba574e	2026-05-10 09:18:07.610493+00	2026-04-10 09:59:58.610104+00	2026-04-10 09:18:07.61101+00	127.0.0.1
b674b563-2543-4707-960f-52667c886702	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	beae921abdb55de8b350112083d11d3b90f6ed42b489607d6bbd7a19d1215923	2026-05-10 10:00:46.473478+00	2026-04-10 11:03:56.45425+00	2026-04-10 10:00:46.473804+00	127.0.0.1
3f241bb9-f1d8-480e-af27-be6e62349d25	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	a4f466a940530890247d7c39d66fa6510d735e5aedd9cf3c2bc766dc1ecfa35d	2026-05-10 11:04:13.52777+00	\N	2026-04-10 11:04:13.528126+00	127.0.0.1
105bf1f9-e0b0-40ed-b886-e25aabc8c3b2	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	bab0a3c56591011acc6c7df95986488489f818ae2a577c65649bdab957073f05	2026-05-13 17:53:08.378752+00	2026-04-13 19:15:49.381327+00	2026-04-13 17:53:08.379247+00	127.0.0.1
9c009ed8-79e0-46cd-a03d-c1d5b67bca60	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	a0fa5ec903b2a3ea168da7daf1f329767e7742382ac49c89e1fc8bd8ce3750b5	2026-05-13 19:16:16.205476+00	\N	2026-04-13 19:16:16.205961+00	127.0.0.1
7380d60d-a3cb-4173-accc-4b34daa4f81c	7ba23edd-75f8-4293-8b5e-4cd7cadb9081	4b4ca5a7712250f171f3c89c703f0746aafcd0a440c6879a9a14c92070750659	2026-05-13 19:44:18.126947+00	\N	2026-04-13 19:44:18.127456+00	127.0.0.1
3bb22110-2585-4f1d-abb5-436ddc98ff22	29e4abd0-9d43-49ff-98c5-4558a8f18601	ad9aced00b9365993697d5d3cade2bfae26e4fb13664b71d7c3fa5cc0d384cd8	2026-05-15 07:02:31.181544+00	\N	2026-04-15 07:02:31.181983+00	127.0.0.1
ad502709-cfe0-4351-b3f0-785fd6de7f4a	bfb911f9-7d81-467d-a264-82f659994912	041c887abaea3cce5f83b76109becbfbb76dacfc8592338366f939e4e09fb00f	2026-05-15 08:56:25.361209+00	\N	2026-04-15 08:56:25.361628+00	127.0.0.1
6e760a10-90dc-4839-8572-9d85981af664	bfb911f9-7d81-467d-a264-82f659994912	514d86f5c733599a64c92a87eacfe0542e40a8e4cfdb1af1a132ef0f6a129d66	2026-05-15 09:31:17.63116+00	\N	2026-04-15 09:31:17.631641+00	127.0.0.1
\.


--
-- Data for Name: certificate_sequences; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.certificate_sequences (year, last_seq) FROM stdin;
2026	3
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.certificates (id, application_id, certificate_number, file_name, file_path, file_size_bytes, mime_type, issued_by, issued_at, valid_from, valid_until, is_revoked, revoked_at, revoked_by, revocation_reason, created_at, updated_at, org_name) FROM stdin;
\.


--
-- Data for Name: internal_notes; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.internal_notes (id, application_id, approval_id, author_id, author_name, author_role, body, note, is_pinned, created_at) FROM stdin;
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.invitations (id, email, full_name, role, body, job_title, department, staff_number, token, token_hash, status, expires_at, invited_by, personal_note, accepted_at, accepted_by_user_id, revoked_at, revoked_by, revocation_reason, resend_count, last_resent_at, last_resent_by, deleted_at, deleted_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.notifications (id, user_id, application_id, entity_type, entity_id, type, channel, subject, message, action_url, action_label, status, is_read, read_at, sent_at, failed_at, failure_reason, retry_count, next_retry_at, idempotency_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organisations; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.organisations (id, user_id, org_name, org_type, establishment_date, website, division, is_zifa_registered, zifa_affiliation_number, moe_registration_number, principal_name, is_official_school_sport, physical_address, city, province, primary_contact_name, primary_contact_title, primary_contact_mobile, primary_contact_email, secondary_contact_name, secondary_contact_title, secondary_contact_mobile, secondary_contact_email, emergency_contact_name, emergency_contact_mobile, emergency_contact_relation, status, profile_submitted_at, profile_submission_count, reviewed_by, reviewed_at, rejection_reason, admin_notes, suspension_reason, info_requested, info_request_message, info_requested_at, deleted_at, deleted_by, created_at, updated_at, sport) FROM stdin;
1bc1db23-259a-465f-8a3c-6347fe1c1803	29e4abd0-9d43-49ff-98c5-4558a8f18601	Chevrons	club	2000-01-09	\N	\N	f	\N	\N	\N	f	G02 Block 2	Harare	Harare	Tinashe Charles Cheuka	\N	+263713123711	ctcheuka@gmail.com	\N	\N	\N	\N	\N	\N	\N	incomplete	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	2026-04-09 19:42:29.189015+00	2026-04-09 19:42:29.189015+00	cricket
\.


--
-- Data for Name: sport_body; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.sport_body (id, name, sport_type, created_at, short_name) FROM stdin;
1	Zimbabwe Cricket	cricket	2026-04-10 10:48:12.962309	Zim Cricket
\.


--
-- Data for Name: travel_personnel; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.travel_personnel (id, application_id, full_name, gender, date_of_birth, national_id_number, passport_number, passport_expiry, role, "position", status, deleted_at, created_at, updated_at) FROM stdin;
b8d86315-4292-4158-9d57-244b0e9f423e	a068bba5-79ea-454c-878b-cce8f71cc439	Tom Paul	male	1998-05-01	63-1234567X00	AB1234567	2030-12-31	player	Bowler	active	\N	2026-04-15 07:32:26.284985+00	2026-04-15 07:32:26.284985+00
935e9af5-98d2-4a9b-9329-42a88cb3014c	a068bba5-79ea-454c-878b-cce8f71cc439	Rick Flair	male	1998-05-02	63-1234567X01	AB1234568	2030-11-14	player	Batsman	active	\N	2026-04-15 07:32:26.284985+00	2026-04-15 07:32:26.284985+00
aa84e377-ac2f-4ebf-81e0-75ccdd79e209	a068bba5-79ea-454c-878b-cce8f71cc439	Josh Dunn	male	1998-05-03	63-1234567X02	AB1234569	2031-10-14	coach	Staff	active	\N	2026-04-15 07:32:26.284985+00	2026-04-15 07:32:26.284985+00
20795ad4-82d1-4df2-a908-361b998ee027	a068bba5-79ea-454c-878b-cce8f71cc439	Sarah Smith	female	1998-05-04	63-1234567X03	AB1234570	2034-11-23	medical	Staff	active	\N	2026-04-15 07:32:26.284985+00	2026-04-15 07:32:26.284985+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: ztap_user
--

COPY public.users (id, email, password_hash, full_name, mobile_number, role, body, status, status_reason, email_verified, email_verified_at, email_verify_token, email_verify_token_expires, password_reset_token, password_reset_token_expires, password_changed_at, last_login_at, last_login_ip, failed_login_attempts, locked_until, activated_at, activated_by, deactivated_at, deactivated_by, invited_by, deleted_at, deleted_by, created_at, updated_at, sports_body) FROM stdin;
7ba23edd-75f8-4293-8b5e-4cd7cadb9081	ctcheuka@gmail.com	$2b$12$C6ovzthEf0ny51X10/WnxekWnWQXtcXwOUlYQoX95koJQvKCBqB3O	Tinashe Cheuka	\N	system_admin	\N	active	\N	t	2026-03-21 07:54:24.922333+00	\N	\N	\N	\N	\N	2026-04-13 19:44:18.125012+00	127.0.0.1	0	\N	2026-03-21 07:54:24.922333+00	\N	\N	\N	\N	\N	\N	2026-03-21 07:54:24.922333+00	2026-04-13 19:44:18.125012+00	\N
29e4abd0-9d43-49ff-98c5-4558a8f18601	mochonam19@gmail.com	$2a$10$Dy0EDjyVqubnO3g95MI8M./BPmHcgI9aFpVrKfUFvW60vuYDFwLYW	John Doe	+263713123711	applicant	\N	active	\N	t	2026-03-21 14:49:24.906002+00	\N	\N	\N	\N	\N	2026-04-15 07:02:31.17897+00	127.0.0.1	0	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-21 14:49:06.430832+00	2026-04-15 07:02:31.17897+00	\N
521a4f80-b132-4864-89ba-3e38d6af74f9	itmlgpw@gmail.com	$2b$12$C6ovzthEf0ny51X10/WnxekWnWQXtcXwOUlYQoX95koJQvKCBqB3O	George Foreman	\N	reviewer	SRC	active	\N	t	2026-03-21 17:50:51.531457+00	\N	\N	\N	\N	\N	2026-03-24 10:25:18.085587+00	127.0.0.1	0	\N	2026-03-21 17:50:51.531457+00	\N	\N	\N	\N	\N	\N	2026-03-21 17:50:51.531457+00	2026-03-24 10:25:18.085587+00	\N
54c01d73-1045-46d7-8f71-21cda52502d5	nyashat2005@gmail.com	$2b$12$C6ovzthEf0ny51X10/WnxekWnWQXtcXwOUlYQoX95koJQvKCBqB3O	GPink Floyd	\N	reviewer	IMMIGRATION	active	\N	t	2026-03-21 17:51:52.238806+00	\N	\N	\N	\N	\N	2026-03-24 10:27:32.451381+00	127.0.0.1	0	\N	2026-03-21 17:51:52.238806+00	\N	\N	\N	\N	\N	\N	2026-03-21 17:51:52.238806+00	2026-03-24 10:27:32.451381+00	\N
bfb911f9-7d81-467d-a264-82f659994912	mlgpwhumanresources@gmail.com	$2b$12$tvR4c32UTlUg66s4qEQIfuAv8SpasKZcciDv9lA57He0o9iSaITge	Tom Paul	\N	reviewer	SPORT_BODY	active	\N	t	2026-03-21 17:49:21.814099+00	\N	\N	85779c1ba7d662660f4faded05efe1f66b41c29f4ddf4365f3ac377ea7612480	2026-03-22 13:03:41.319756+00	\N	2026-04-15 09:31:17.62943+00	127.0.0.1	0	\N	2026-03-21 17:49:21.814099+00	\N	\N	\N	\N	\N	\N	2026-03-21 17:49:21.814099+00	2026-04-15 09:31:17.62943+00	1
\.


--
-- Name: sport_body_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ztap_user
--

SELECT pg_catalog.setval('public.sport_body_id_seq', 1, true);


--
-- Name: application_sequences application_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.application_sequences
    ADD CONSTRAINT application_sequences_pkey PRIMARY KEY (year);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: applications applications_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_reference_number_key UNIQUE (reference_number);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_refresh_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- Name: certificate_sequences certificate_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificate_sequences
    ADD CONSTRAINT certificate_sequences_pkey PRIMARY KEY (year);


--
-- Name: certificates certificates_application_id_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_application_id_key UNIQUE (application_id);


--
-- Name: certificates certificates_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: internal_notes internal_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.internal_notes
    ADD CONSTRAINT internal_notes_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_hash_key UNIQUE (token_hash);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: notifications notifications_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organisations organisations_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_pkey PRIMARY KEY (id);


--
-- Name: organisations organisations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_user_id_key UNIQUE (user_id);


--
-- Name: sport_body sport_body_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.sport_body
    ADD CONSTRAINT sport_body_pkey PRIMARY KEY (id);


--
-- Name: travel_personnel travel_personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.travel_personnel
    ADD CONSTRAINT travel_personnel_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_verify_token_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_verify_token_key UNIQUE (email_verify_token);


--
-- Name: users users_password_reset_token_key; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_password_reset_token_key UNIQUE (password_reset_token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_applications_applicant_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_applicant_id ON public.applications USING btree (applicant_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_applications_departure_date; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_departure_date ON public.applications USING btree (departure_date) WHERE (deleted_at IS NULL);


--
-- Name: idx_applications_flagged; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_flagged ON public.applications USING btree (flagged) WHERE ((flagged = true) AND (deleted_at IS NULL));


--
-- Name: idx_applications_organisation_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_organisation_id ON public.applications USING btree (organisation_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_applications_queue; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_queue ON public.applications USING btree (status, submitted_at) WHERE ((deleted_at IS NULL) AND (status <> ALL (ARRAY['draft'::public.application_status, 'awaiting_payment'::public.application_status, 'withdrawn'::public.application_status])));


--
-- Name: idx_applications_reference_number; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_reference_number ON public.applications USING btree (reference_number);


--
-- Name: idx_applications_status; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_status ON public.applications USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_applications_submitted_at; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_applications_submitted_at ON public.applications USING btree (submitted_at) WHERE ((submitted_at IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_approvals_application_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_approvals_application_id ON public.approvals USING btree (application_id);


--
-- Name: idx_approvals_assigned_to; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_approvals_assigned_to ON public.approvals USING btree (assigned_to) WHERE (assigned_to IS NOT NULL);


--
-- Name: idx_approvals_body_pending; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_approvals_body_pending ON public.approvals USING btree (body, created_at) WHERE (status = 'pending'::public.approval_status);


--
-- Name: idx_approvals_body_status; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_approvals_body_status ON public.approvals USING btree (body, status);


--
-- Name: idx_approvals_overdue; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_approvals_overdue ON public.approvals USING btree (body, sla_deadline) WHERE (is_overdue = true);


--
-- Name: idx_approvals_queue; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_approvals_queue ON public.approvals USING btree (body, status, created_at) WHERE (status <> ALL (ARRAY['approved'::public.approval_status, 'rejected'::public.approval_status]));


--
-- Name: idx_audit_logs_action_date; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_audit_logs_action_date ON public.audit_logs USING btree (action, created_at DESC);


--
-- Name: idx_audit_logs_actor_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: idx_audit_logs_application_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_audit_logs_application_id ON public.audit_logs USING btree (application_id, created_at DESC) WHERE (application_id IS NOT NULL);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: idx_auth_sessions_expires; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_auth_sessions_expires ON public.auth_sessions USING btree (expires_at) WHERE (revoked_at IS NULL);


--
-- Name: idx_auth_sessions_user_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);


--
-- Name: idx_certificates_application_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_certificates_application_id ON public.certificates USING btree (application_id);


--
-- Name: idx_certificates_issued_at; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_certificates_issued_at ON public.certificates USING btree (issued_at DESC);


--
-- Name: idx_certificates_number; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_certificates_number ON public.certificates USING btree (certificate_number);


--
-- Name: idx_certificates_valid_until; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_certificates_valid_until ON public.certificates USING btree (valid_until) WHERE (is_revoked = false);


--
-- Name: idx_internal_notes_application_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_internal_notes_application_id ON public.internal_notes USING btree (application_id, created_at DESC);


--
-- Name: idx_internal_notes_approval_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_internal_notes_approval_id ON public.internal_notes USING btree (approval_id, created_at DESC);


--
-- Name: idx_internal_notes_author_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_internal_notes_author_id ON public.internal_notes USING btree (author_id, created_at DESC);


--
-- Name: idx_internal_notes_pinned; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_internal_notes_pinned ON public.internal_notes USING btree (approval_id, is_pinned DESC, created_at DESC);


--
-- Name: idx_invitations_email; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_invitations_email ON public.invitations USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: idx_invitations_expiry_check; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_invitations_expiry_check ON public.invitations USING btree (expires_at) WHERE (status = 'pending'::public.invitation_status);


--
-- Name: idx_invitations_invited_by; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_invitations_invited_by ON public.invitations USING btree (invited_by) WHERE (deleted_at IS NULL);


--
-- Name: idx_invitations_pending; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_invitations_pending ON public.invitations USING btree (created_at DESC) WHERE ((status = 'pending'::public.invitation_status) AND (deleted_at IS NULL));


--
-- Name: idx_invitations_status; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_invitations_status ON public.invitations USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_invitations_token_hash; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_invitations_token_hash ON public.invitations USING btree (token_hash) WHERE (deleted_at IS NULL);


--
-- Name: idx_notifications_application_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_notifications_application_id ON public.notifications USING btree (application_id, created_at DESC) WHERE (application_id IS NOT NULL);


--
-- Name: idx_notifications_pending; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_notifications_pending ON public.notifications USING btree (channel, created_at) WHERE (status = 'pending'::public.notification_status);


--
-- Name: idx_notifications_retry; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_notifications_retry ON public.notifications USING btree (next_retry_at) WHERE ((status = 'failed'::public.notification_status) AND (next_retry_at IS NOT NULL));


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE ((is_read = false) AND (channel = 'in_app'::public.notification_channel));


--
-- Name: idx_organisations_moe_number; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_moe_number ON public.organisations USING btree (moe_registration_number) WHERE ((moe_registration_number IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_organisations_org_name; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_org_name ON public.organisations USING btree (lower((org_name)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_organisations_org_type; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_org_type ON public.organisations USING btree (org_type) WHERE (deleted_at IS NULL);


--
-- Name: idx_organisations_province; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_province ON public.organisations USING btree (province) WHERE (deleted_at IS NULL);


--
-- Name: idx_organisations_status; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_status ON public.organisations USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_organisations_user_id; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_user_id ON public.organisations USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_organisations_zifa_number; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_organisations_zifa_number ON public.organisations USING btree (zifa_affiliation_number) WHERE ((zifa_affiliation_number IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_users_body; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_body ON public.users USING btree (body) WHERE ((deleted_at IS NULL) AND (body IS NOT NULL));


--
-- Name: idx_users_body_status; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_body_status ON public.users USING btree (body, status) WHERE ((deleted_at IS NULL) AND (body IS NOT NULL));


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_email_verify_token; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_email_verify_token ON public.users USING btree (email_verify_token) WHERE (email_verify_token IS NOT NULL);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token) WHERE (password_reset_token IS NOT NULL);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_role ON public.users USING btree (role) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: ztap_user
--

CREATE INDEX idx_users_status ON public.users USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: applications trg_application_submitted; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_application_submitted AFTER UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.create_approval_rows();


--
-- Name: applications trg_applications_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: approvals trg_approvals_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_approvals_updated_at BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: certificates trg_certificates_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: approvals trg_check_all_approved; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_check_all_approved AFTER UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.check_all_approved();


--
-- Name: approvals trg_check_any_rejected; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_check_any_rejected AFTER UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.check_any_rejected();


--
-- Name: invitations trg_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: applications trg_lock_submitted_application; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_lock_submitted_application BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.prevent_submitted_edits();


--
-- Name: approvals trg_manage_sla_clock; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_manage_sla_clock BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.manage_sla_clock();


--
-- Name: notifications trg_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: organisations trg_organisations_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_organisations_updated_at BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: internal_notes trg_prevent_internal_note_deletes; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_prevent_internal_note_deletes BEFORE DELETE ON public.internal_notes FOR EACH ROW EXECUTE FUNCTION public.prevent_internal_note_deletes();


--
-- Name: internal_notes trg_prevent_internal_note_edits; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_prevent_internal_note_edits BEFORE UPDATE ON public.internal_notes FOR EACH ROW EXECUTE FUNCTION public.prevent_internal_note_edits();


--
-- Name: applications trg_set_submitted_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_set_submitted_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();


--
-- Name: notifications trg_stamp_notification_read_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_stamp_notification_read_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.stamp_notification_read_at();


--
-- Name: approvals trg_sync_application_under_review; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_sync_application_under_review AFTER UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.sync_application_under_review();


--
-- Name: certificates trg_sync_certificate_issued; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_sync_certificate_issued AFTER INSERT ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.sync_certificate_issued();


--
-- Name: organisations trg_sync_org_status_to_user; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_sync_org_status_to_user AFTER UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.sync_org_status_to_user();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: certificates trg_validate_certificate_insert; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_validate_certificate_insert BEFORE INSERT ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.validate_certificate_insert();


--
-- Name: invitations trg_validate_invitation_acceptance; Type: TRIGGER; Schema: public; Owner: ztap_user
--

CREATE TRIGGER trg_validate_invitation_acceptance BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.validate_invitation_acceptance();


--
-- Name: applications applications_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: applications applications_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applications applications_flagged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applications applications_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE RESTRICT;


--
-- Name: applications applications_withdrawn_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_withdrawn_by_fkey FOREIGN KEY (withdrawn_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: approvals approvals_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE RESTRICT;


--
-- Name: approvals approvals_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: approvals approvals_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: approvals approvals_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: approvals approvals_first_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_first_opened_by_fkey FOREIGN KEY (first_opened_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: approvals approvals_original_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_original_decided_by_fkey FOREIGN KEY (original_decided_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: approvals approvals_overridden_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_overridden_by_fkey FOREIGN KEY (overridden_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE RESTRICT;


--
-- Name: certificates certificates_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: certificates certificates_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_activated_by; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_activated_by FOREIGN KEY (activated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_deactivated_by; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_deleted_by; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_invited_by; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_invited_by FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: internal_notes internal_notes_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.internal_notes
    ADD CONSTRAINT internal_notes_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE RESTRICT;


--
-- Name: internal_notes internal_notes_approval_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.internal_notes
    ADD CONSTRAINT internal_notes_approval_id_fkey FOREIGN KEY (approval_id) REFERENCES public.approvals(id) ON DELETE RESTRICT;


--
-- Name: internal_notes internal_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.internal_notes
    ADD CONSTRAINT internal_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: invitations invitations_accepted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_accepted_by_user_id_fkey FOREIGN KEY (accepted_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: invitations invitations_last_resent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_last_resent_by_fkey FOREIGN KEY (last_resent_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: organisations organisations_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organisations organisations_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organisations organisations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: travel_personnel travel_personnel_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ztap_user
--

ALTER TABLE ONLY public.travel_personnel
    ADD CONSTRAINT travel_personnel_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: ztap_user
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_insert_only; Type: POLICY; Schema: public; Owner: ztap_user
--

CREATE POLICY audit_logs_insert_only ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: audit_logs audit_logs_no_delete; Type: POLICY; Schema: public; Owner: ztap_user
--

CREATE POLICY audit_logs_no_delete ON public.audit_logs FOR DELETE USING (false);


--
-- Name: audit_logs audit_logs_no_update; Type: POLICY; Schema: public; Owner: ztap_user
--

CREATE POLICY audit_logs_no_update ON public.audit_logs FOR UPDATE USING (false);


--
-- Name: audit_logs audit_logs_select; Type: POLICY; Schema: public; Owner: ztap_user
--

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (true);


--
-- PostgreSQL database dump complete
--

\unrestrict yUglrBvTUPirdeKeYpeESVAhp51a3mkWg2CxJkgNqj6EdKL8C4qjyUW0LHjZwBm

