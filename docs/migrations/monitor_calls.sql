-- Short-lived manual call requests. Public readers use the filtered server endpoint.
BEGIN;
CREATE TABLE IF NOT EXISTS public.monitor_calls (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id bigint NOT NULL,
  actor_id uuid NOT NULL,
  service text NOT NULL,
  subcategory text,
  counter integer,
  cubicle text,
  ticket text NOT NULL,
  message text NOT NULL CHECK (length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '90 seconds')
);
ALTER TABLE public.monitor_calls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monitor_calls FROM anon, authenticated;
GRANT ALL ON public.monitor_calls TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.monitor_calls_id_seq TO service_role;
CREATE INDEX IF NOT EXISTS monitor_calls_feed ON public.monitor_calls (service, id);
CREATE INDEX IF NOT EXISTS monitor_calls_actor ON public.monitor_calls (actor_id, created_at);
CREATE INDEX IF NOT EXISTS monitor_calls_patient ON public.monitor_calls (patient_id, created_at);

-- Serialize repeated clicks across tabs and instances before checking the cooldown.
CREATE OR REPLACE FUNCTION public.enqueue_monitor_call(
  p_patient_id bigint, p_actor_id uuid, p_service text, p_subcategory text,
  p_counter integer, p_cubicle text, p_ticket text, p_message text
) RETURNS boolean LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_actor_id::text, 0));
  PERFORM pg_advisory_xact_lock(p_patient_id);
  IF EXISTS (SELECT 1 FROM public.monitor_calls WHERE patient_id = p_patient_id
    AND created_at > clock_timestamp() - interval '5 seconds') THEN RETURN false; END IF;
  IF (SELECT count(*) FROM public.monitor_calls WHERE actor_id = p_actor_id
    AND created_at > clock_timestamp() - interval '1 minute') >= 12 THEN RETURN false; END IF;
  DELETE FROM public.monitor_calls WHERE expires_at < clock_timestamp() - interval '1 day';
  INSERT INTO public.monitor_calls (patient_id, actor_id, service, subcategory, counter, cubicle, ticket, message)
    VALUES (p_patient_id, p_actor_id, p_service, p_subcategory, p_counter, p_cubicle, p_ticket, p_message);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_monitor_call(bigint, uuid, text, text, integer, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_monitor_call(bigint, uuid, text, text, integer, text, text, text) TO service_role;
COMMIT;
