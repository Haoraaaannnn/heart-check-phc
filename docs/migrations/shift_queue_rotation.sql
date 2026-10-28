-- Shift rotation state and server-enforced cancellation. Run before deploying the UI changes.
BEGIN;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS rotation_shift_started_at timestamptz;
COMMENT ON COLUMN public.patients.rotation_shift_started_at IS
  'Rotation count window: Manila midnight to 13:00, or 13:00 to midnight. Removed tickets remain available for reporting.';

CREATE OR REPLACE FUNCTION public.current_queue_shift()
RETURNS timestamptz LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT (date_trunc('day', now() AT TIME ZONE 'Asia/Manila') +
    CASE WHEN extract(hour FROM now() AT TIME ZONE 'Asia/Manila') >= 13
      THEN interval '13 hours' ELSE interval '0 hours' END) AT TIME ZONE 'Asia/Manila';
$$;

-- Keep existing active counts in this shift; older idle tickets from today rejoin normally.
UPDATE public.patients SET rotation_shift_started_at = public.current_queue_shift()
WHERE is_historical = false AND rotation_shift_started_at IS NULL;

-- Recover today's old idle pool before enabling the new reset restrictions.
UPDATE public.patients SET status = CASE WHEN reg_end IS NULL THEN 'Waiting' ELSE 'On Progress' END,
  rotation_count = 0, rotation_shift_started_at = public.current_queue_shift(), idle_at = NULL,
  progress_started_at = NULL, cubicle_top_started_at = NULL, counter_top_started_at = NULL
WHERE is_historical = false AND status = 'Idle'
  AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila';

CREATE OR REPLACE FUNCTION public.enforce_shift_rotation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE shift_start timestamptz := public.current_queue_shift();
BEGIN
  IF NEW.is_historical IS DISTINCT FROM false THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.rotation_count := 0;
    NEW.rotation_shift_started_at := shift_start;
    RETURN NEW;
  END IF;
  IF NEW.rotation_count = 0 THEN
    IF coalesce(OLD.rotation_count, 0) > 0 AND
      (OLD.rotation_shift_started_at IS NOT DISTINCT FROM shift_start OR
       NEW.rotation_shift_started_at IS DISTINCT FROM shift_start) THEN
      RAISE EXCEPTION 'Rotation counts reset only at shift rollover' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status NOT IN ('Waiting', 'On Progress', 'Assigned') THEN
    RAISE EXCEPTION 'Only waiting tickets can rotate' USING ERRCODE = '23514';
  END IF;
  NEW.rotation_count := CASE WHEN OLD.rotation_shift_started_at = shift_start
    THEN coalesce(OLD.rotation_count, 0) ELSE 0 END + 1;
  NEW.rotation_shift_started_at := shift_start;
  IF NEW.rotation_count > 5 THEN
    NEW.status := 'Removed';
    NEW.removed_at := now();
    NEW.queue_position := NULL;
    NEW.counter := NULL;
    NEW."cubicleNum" := NULL;
    NEW.counter_top_started_at := NULL;
    NEW.counter_rejoin_at := NULL;
    NEW.counter_paused_at := NULL;
    NEW.progress_started_at := NULL;
    NEW.cubicle_top_started_at := NULL;
    NEW.called_at := NULL;
    NEW.cooldown_until := NULL;
  ELSIF NEW.status IN ('Idle', 'Removed') THEN
    RAISE EXCEPTION 'Rotation limit has not been exceeded' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_shift_rotation() FROM PUBLIC;
DROP TRIGGER IF EXISTS enforce_shift_rotation ON public.patients;
CREATE TRIGGER enforce_shift_rotation BEFORE INSERT OR UPDATE OF rotation_count ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.enforce_shift_rotation();

CREATE OR REPLACE FUNCTION public.reset_queue_shift()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE affected_count integer; shift_start timestamptz := public.current_queue_shift();
BEGIN
  -- Breaks keep their timers paused; their count resets on resuming or the next rotation.
  UPDATE public.patients p SET rotation_count = 0, rotation_shift_started_at = shift_start
  WHERE p.is_historical = false AND p.status IN ('Waiting', 'On Progress', 'Assigned')
    AND p.created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila'
    AND p.created_at <= now()
    AND (p.rotation_shift_started_at IS NULL OR p.rotation_shift_started_at < shift_start)
    AND NOT EXISTS (SELECT 1 FROM public.counters c WHERE c.counter_number = p.counter AND c.on_break AND p.reg_end IS NULL)
    AND NOT EXISTS (SELECT 1 FROM public.cubicle c WHERE c."cubicleNum" = p."cubicleNum" AND c.on_break);
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;
REVOKE ALL ON FUNCTION public.reset_queue_shift() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_queue_shift() TO service_role;
COMMIT;
