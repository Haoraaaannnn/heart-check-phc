-- Staff-controlled breaks are independent of administrative counter activation.
BEGIN;
ALTER TABLE public.counters ADD COLUMN IF NOT EXISTS on_break boolean NOT NULL DEFAULT false;
ALTER TABLE public.cubicle ADD COLUMN IF NOT EXISTS on_break boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.counters.on_break IS 'Staff break: excludes this counter from intake and public monitors.';
COMMENT ON COLUMN public.cubicle.on_break IS 'Staff break: excludes this cubicle from assignments and public monitors.';

-- Station-row locks serialize assignment against break changes, including service-role writes.
CREATE OR REPLACE FUNCTION public.guard_station_break_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE station_closed boolean;
BEGIN
  IF NEW.is_historical IS DISTINCT FROM false THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.rotation_count IS DISTINCT FROM OLD.rotation_count THEN
    IF OLD.counter IS NOT NULL AND OLD.reg_end IS NULL THEN
      SELECT on_break INTO station_closed FROM public.counters
        WHERE counter_number = OLD.counter FOR SHARE;
      IF station_closed THEN
        RAISE EXCEPTION 'Counter is on break' USING ERRCODE = '23514';
      END IF;
    END IF;
    IF OLD."cubicleNum" IS NOT NULL THEN
      SELECT on_break INTO station_closed FROM public.cubicle
        WHERE "cubicleNum" = OLD."cubicleNum" FOR SHARE;
      IF station_closed THEN
        RAISE EXCEPTION 'Cubicle is on break' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  IF NEW.counter IS NOT NULL AND NEW.reg_end IS NULL THEN
    IF TG_OP = 'INSERT' OR NEW.counter IS DISTINCT FROM OLD.counter THEN
      SELECT (NOT active OR on_break) INTO station_closed
        FROM public.counters WHERE counter_number = NEW.counter FOR SHARE;
      -- Keep newly issued tickets waiting when no intake desk is available.
      IF station_closed IS DISTINCT FROM false THEN
        IF TG_OP = 'INSERT' THEN
          NEW.counter := NULL;
          NEW.reg_start := NULL;
          NEW.counter_top_started_at := NULL;
        ELSE
          RAISE EXCEPTION 'Counter is unavailable or on break' USING ERRCODE = '23514';
        END IF;
      END IF;
    END IF;
  END IF;
  IF NEW."cubicleNum" IS NOT NULL THEN
    IF TG_OP = 'INSERT' OR NEW."cubicleNum" IS DISTINCT FROM OLD."cubicleNum"
       OR (NEW.status = 'Assigned' AND OLD.status IS DISTINCT FROM 'Assigned') THEN
      SELECT on_break INTO station_closed FROM public.cubicle
        WHERE "cubicleNum" = NEW."cubicleNum" FOR SHARE;
      IF station_closed IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'Cubicle is unavailable or on break' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_station_break_assignment() FROM PUBLIC;
DROP TRIGGER IF EXISTS guard_station_break_assignment ON public.patients;
CREATE TRIGGER guard_station_break_assignment BEFORE INSERT OR UPDATE OF counter, "cubicleNum", status, rotation_count
  ON public.patients FOR EACH ROW EXECUTE FUNCTION public.guard_station_break_assignment();

-- Existing RLS remains in force. Direct SDK writes cannot bypass station ownership either.
CREATE OR REPLACE FUNCTION public.guard_staff_station_break()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE staff_id public.users.id%TYPE; staff_role text; permitted boolean := false;
BEGIN
  IF NEW.on_break IS NOT DISTINCT FROM OLD.on_break THEN RETURN NEW; END IF;
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  SELECT id, role INTO staff_id, staff_role FROM public.users WHERE auth_id = auth.uid();
  IF staff_role IN ('admin', 'superadmin') THEN RETURN NEW; END IF;
  IF staff_role IS NULL OR staff_role NOT IN ('staff', 'registration', 'nurse', 'doctor') THEN
    RAISE EXCEPTION 'Staff authorization required' USING ERRCODE = '42501';
  END IF;
  IF TG_TABLE_NAME = 'counters' THEN
    SELECT EXISTS(SELECT 1 FROM public.user_counters WHERE user_id = staff_id AND counter = OLD.counter_number) INTO permitted;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.user_cubicles WHERE user_id = staff_id AND cubicle_id = OLD.id)
      OR EXISTS(SELECT 1 FROM public.user_rooms WHERE user_id = staff_id AND service = OLD.category AND room = OLD.room
        AND (subcategory IS NULL OR subcategory = OLD.subcategory))
      OR EXISTS(SELECT 1 FROM public.doctors WHERE auth_id = auth.uid() AND id = OLD."doctorId") INTO permitted;
  END IF;
  IF NOT permitted THEN RAISE EXCEPTION 'Station is not assigned to you' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_staff_station_break() FROM PUBLIC;
DROP TRIGGER IF EXISTS guard_staff_station_break ON public.counters;
CREATE TRIGGER guard_staff_station_break BEFORE UPDATE OF on_break ON public.counters
  FOR EACH ROW EXECUTE FUNCTION public.guard_staff_station_break();
DROP TRIGGER IF EXISTS guard_staff_station_break ON public.cubicle;
CREATE TRIGGER guard_staff_station_break BEFORE UPDATE OF on_break ON public.cubicle
  FOR EACH ROW EXECUTE FUNCTION public.guard_staff_station_break();
COMMIT;
