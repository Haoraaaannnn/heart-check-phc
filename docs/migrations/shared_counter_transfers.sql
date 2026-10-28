-- Cross-counter handoff retains service eligibility and live-record guards.
BEGIN;
CREATE OR REPLACE FUNCTION public.move_registration_ticket(
  caller_auth_id uuid, patient_id bigint, source_counter integer, destination_counter integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE staff_id public.users.id%TYPE; staff_role text; ticket public.patients%ROWTYPE; destination public.counters%ROWTYPE;
BEGIN
  SELECT id, role INTO staff_id, staff_role FROM public.users WHERE auth_id = caller_auth_id;
  IF staff_role IS NULL OR staff_role NOT IN ('superadmin', 'admin', 'registration', 'staff', 'nurse') THEN
    RAISE EXCEPTION 'Transfer authorization required' USING ERRCODE = '42501';
  END IF;
  IF source_counter = destination_counter THEN RETURN false; END IF;
  SELECT * INTO ticket FROM public.patients WHERE id = patient_id AND is_historical = false
    AND counter = source_counter AND reg_end IS NULL AND status IN ('Waiting', 'On Progress') FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF staff_role NOT IN ('superadmin', 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.user_services WHERE user_id = staff_id AND service = ticket.service
  ) THEN RAISE EXCEPTION 'Service authorization required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO destination FROM public.counters WHERE counter_number = destination_counter FOR SHARE;
  IF NOT FOUND OR NOT destination.active OR destination.on_break THEN RETURN false; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_counters uc JOIN public.user_services us ON us.user_id = uc.user_id
    WHERE uc.counter = destination_counter AND
      (lower(trim(us.service)) = lower(trim(ticket.service)) OR
       (lower(trim(us.service)) IN ('opd', 'opd screening') AND lower(trim(ticket.service)) IN ('opd', 'opd screening')))
  ) THEN RETURN false; END IF;
  UPDATE public.patients SET counter = destination_counter, counter_top_started_at = NULL,
    counter_rejoin_at = now(), counter_paused_at = NULL
    WHERE id = patient_id AND is_historical = false AND counter = source_counter;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.move_registration_ticket(uuid, bigint, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_registration_ticket(uuid, bigint, integer, integer) TO service_role;
COMMIT;
