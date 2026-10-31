-- Durable, append-only ticket movement history. Run once through an approved database-admin session.
-- No patient names, contacts, credentials, or raw request bodies are stored here.
BEGIN;

CREATE TABLE IF NOT EXISTS public.patient_movement_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id bigint NOT NULL,
  ticket text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  actor_auth_id uuid,
  actor_username text,
  actor_role text,
  actor_kind text NOT NULL CHECK (actor_kind IN ('staff', 'automation', 'kiosk', 'system', 'unattributed', 'baseline')),
  event_type text NOT NULL CHECK (event_type IN ('created', 'movement', 'rotation', 'pause', 'resume', 'call', 'deleted', 'baseline')),
  from_state jsonb,
  to_state jsonb,
  CHECK (from_state IS NOT NULL OR to_state IS NOT NULL)
);
COMMENT ON TABLE public.patient_movement_history IS 'Immutable operational ticket history; identities are snapshotted at write time. Existing records begin at a labelled baseline.';
CREATE INDEX IF NOT EXISTS patient_movement_history_ticket_order ON public.patient_movement_history(patient_id, id);
ALTER TABLE public.patient_movement_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_movement_history FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.patient_movement_history TO service_role;
REVOKE ALL ON SEQUENCE public.patient_movement_history_id_seq FROM PUBLIC, anon, authenticated, service_role;

-- A strict allowlist protects patient PII even if new columns are later added to patients.
CREATE OR REPLACE FUNCTION public.patient_movement_state(row_data jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = pg_catalog, public AS $$
  SELECT jsonb_object_agg(key, value) FROM jsonb_each(row_data)
  WHERE key = ANY(ARRAY['status','counter','cubicleNum','service','subcategory','queue_position',
    'rotation_count','reg_start','reg_end','consult_start','consult_end','carryout_start','carryout_end',
    'counter_paused_at','idle_at','removed_at']);
$$;
REVOKE ALL ON FUNCTION public.patient_movement_state(jsonb) FROM PUBLIC, anon, authenticated, service_role;

-- Authenticated clients cannot impersonate another operator by forging the server-only header.
CREATE OR REPLACE FUNCTION public.patient_movement_actor()
RETURNS TABLE(actor_id uuid, username text, staff_role text, kind text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE claims jsonb := COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  headers jsonb := COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::jsonb;
  raw_actor text;
BEGIN
  IF claims->>'role' = 'service_role' THEN
    raw_actor := headers->>'x-hc-actor-id';
    IF raw_actor IS NOT NULL AND raw_actor !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Invalid audited operator identity' USING ERRCODE = '22023';
    END IF;
    actor_id := raw_actor::uuid;
    kind := CASE WHEN actor_id IS NULL THEN 'unattributed' ELSE 'staff' END;
  ELSE
    actor_id := auth.uid();
    kind := CASE WHEN actor_id IS NOT NULL THEN 'staff' WHEN claims->>'role' = 'anon' THEN 'kiosk' ELSE 'system' END;
  END IF;
  IF actor_id IS NOT NULL THEN
    SELECT u.username, u.role INTO username, staff_role FROM public.users u WHERE u.auth_id = actor_id;
    IF username IS NULL THEN kind := 'unattributed'; END IF;
  END IF;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.patient_movement_actor() FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.capture_patient_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE before_state jsonb; after_state jsonb; record_data jsonb; event_name text; actor record;
BEGIN
  record_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  IF record_data->'is_historical' IS DISTINCT FROM 'false'::jsonb THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  IF TG_OP <> 'INSERT' THEN before_state := public.patient_movement_state(to_jsonb(OLD)); END IF;
  IF TG_OP <> 'DELETE' THEN after_state := public.patient_movement_state(to_jsonb(NEW)); END IF;
  -- Derived display timers and unchanged/idempotent writes are not patient handoffs.
  IF before_state IS NOT DISTINCT FROM after_state THEN RETURN NEW; END IF;
  event_name := CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN TG_OP = 'DELETE' THEN 'deleted'
    WHEN COALESCE((after_state->>'rotation_count')::integer, 0) > COALESCE((before_state->>'rotation_count')::integer, 0) THEN 'rotation'
    WHEN before_state->'counter_paused_at' = 'null'::jsonb AND after_state->>'counter_paused_at' IS NOT NULL THEN 'pause'
    WHEN before_state->>'counter_paused_at' IS NOT NULL AND after_state->>'counter_paused_at' IS NULL THEN 'resume'
    ELSE 'movement' END;
  SELECT * INTO actor FROM public.patient_movement_actor();
  INSERT INTO public.patient_movement_history(patient_id, ticket, actor_auth_id, actor_username, actor_role,
    actor_kind, event_type, from_state, to_state)
  VALUES ((record_data->>'id')::bigint, record_data->>'patientNum', actor.actor_id, actor.username, actor.staff_role,
    CASE WHEN event_name = 'rotation' THEN 'automation' ELSE actor.kind END, event_name, before_state, after_state);
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_patient_movement() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS capture_patient_movement ON public.patients;
CREATE TRIGGER capture_patient_movement AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.capture_patient_movement();

-- Manual calls are recorded atomically with the existing acknowledged monitor event.
CREATE OR REPLACE FUNCTION public.capture_patient_call_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE ticket_row public.patients%ROWTYPE; snapshot jsonb; actor record;
BEGIN
  SELECT * INTO ticket_row FROM public.patients WHERE id = NEW.patient_id AND is_historical = false;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.patient_movement_actor();
  -- A service-only monitor RPC already carries a server-verified actor. Require the header to agree.
  IF actor.actor_id IS DISTINCT FROM NEW.actor_id THEN
    RAISE EXCEPTION 'Call operator identity was not verified' USING ERRCODE = '42501';
  END IF;
  snapshot := public.patient_movement_state(to_jsonb(ticket_row)) ||
    jsonb_build_object('counter', NEW.counter, 'cubicleNum', NEW.cubicle);
  INSERT INTO public.patient_movement_history(patient_id, ticket, actor_auth_id, actor_username, actor_role,
    actor_kind, event_type, from_state, to_state)
  VALUES (NEW.patient_id, NEW.ticket, actor.actor_id, actor.username, actor.staff_role, actor.kind, 'call', snapshot, snapshot);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_patient_call_history() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS capture_patient_call_history ON public.monitor_calls;
CREATE TRIGGER capture_patient_call_history AFTER INSERT ON public.monitor_calls
  FOR EACH ROW EXECUTE FUNCTION public.capture_patient_call_history();

CREATE OR REPLACE FUNCTION public.reject_patient_history_rewrite()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN RAISE EXCEPTION 'Patient movement history is append-only' USING ERRCODE = '42501'; END;
$$;
REVOKE ALL ON FUNCTION public.reject_patient_history_rewrite() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS reject_patient_history_rewrite ON public.patient_movement_history;
CREATE TRIGGER reject_patient_history_rewrite BEFORE UPDATE OR DELETE OR TRUNCATE ON public.patient_movement_history
  FOR EACH STATEMENT EXECUTE FUNCTION public.reject_patient_history_rewrite();

-- This is an observed starting point, not reconstructed handoffs or invented historical usernames.
INSERT INTO public.patient_movement_history(patient_id, ticket, actor_kind, event_type, to_state)
SELECT p.id, p."patientNum", 'baseline', 'baseline', public.patient_movement_state(to_jsonb(p))
FROM public.patients p WHERE p.is_historical = false AND NOT EXISTS (
  SELECT 1 FROM public.patient_movement_history h WHERE h.patient_id = p.id
);
NOTIFY pgrst, 'reload schema';
COMMIT;
