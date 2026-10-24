-- Integration checks use a temporary patient table and roll back every station change.
BEGIN;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
CREATE TEMP TABLE station_break_test_patients (
  is_historical boolean, counter integer, reg_end timestamptz, reg_start timestamptz,
  counter_top_started_at timestamptz, "cubicleNum" text, status text, rotation_count integer
) ON COMMIT DROP;
CREATE TRIGGER test_station_break BEFORE INSERT OR UPDATE ON station_break_test_patients
  FOR EACH ROW EXECUTE FUNCTION public.guard_station_break_assignment();

DO $$
DECLARE desk integer; room_id bigint; room_name text; actual integer; rejected boolean;
BEGIN
  SELECT counter_number INTO STRICT desk FROM public.counters WHERE active = true ORDER BY counter_number LIMIT 1;
  SELECT id, "cubicleNum" INTO STRICT room_id, room_name FROM public.cubicle ORDER BY id LIMIT 1;
  UPDATE public.counters SET on_break = true WHERE counter_number = desk;
  UPDATE public.cubicle SET on_break = true WHERE id = room_id;

  INSERT INTO station_break_test_patients (is_historical, counter, status) VALUES (false, desk, 'On Progress');
  SELECT counter INTO actual FROM station_break_test_patients LIMIT 1;
  IF actual IS NOT NULL THEN RAISE EXCEPTION 'FAIL: new ticket assigned to a closed counter'; END IF;

  rejected := false;
  BEGIN UPDATE station_break_test_patients SET counter = desk;
  EXCEPTION WHEN check_violation THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: reassignment accepted while counter on break'; END IF;

  rejected := false;
  BEGIN
    INSERT INTO station_break_test_patients (is_historical, "cubicleNum", status) VALUES (false, room_name, 'Assigned');
  EXCEPTION WHEN check_violation THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: assignment accepted while cubicle on break'; END IF;

  UPDATE public.counters SET on_break = false WHERE counter_number = desk;
  UPDATE public.cubicle SET on_break = false WHERE id = room_id;
  UPDATE station_break_test_patients SET counter = desk;
  INSERT INTO station_break_test_patients (is_historical, "cubicleNum", status, rotation_count)
    VALUES (false, room_name, 'Assigned', 0);
  UPDATE public.cubicle SET on_break = true WHERE id = room_id;
  rejected := false;
  BEGIN UPDATE station_break_test_patients SET rotation_count = 1 WHERE "cubicleNum" = room_name;
  EXCEPTION WHEN check_violation THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: existing cubicle patient rotated during break'; END IF;

  -- Existing clinical work remains possible; this is not a new incoming assignment.
  UPDATE station_break_test_patients SET status = 'With Doctor' WHERE "cubicleNum" = room_name;
  INSERT INTO station_break_test_patients (is_historical, "cubicleNum", status) VALUES (true, room_name, 'Assigned');

END;
$$;
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000000"}', true);
DO $$
DECLARE room_id bigint; rejected boolean := false; changed integer; test_actor uuid := gen_random_uuid();
BEGIN
  WHILE EXISTS(SELECT 1 FROM public.users WHERE auth_id = test_actor) LOOP test_actor := gen_random_uuid(); END LOOP;
  PERFORM set_config('request.jwt.claim.sub', test_actor::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', test_actor)::text, true);
  SELECT id INTO STRICT room_id FROM public.cubicle ORDER BY id LIMIT 1;
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'FAIL: ownership test role is not authenticated'; END IF;
  IF auth.uid() IS DISTINCT FROM test_actor THEN RAISE EXCEPTION 'FAIL: ownership test user was not set'; END IF;
  BEGIN
    UPDATE public.cubicle SET on_break = NOT on_break WHERE id = room_id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    rejected := changed = 0;
  EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: unassigned caller changed station availability'; END IF;
END;
$$;
SELECT 'PASS: closed-counter intake, blocked reassignment, blocked cubicle assignment, resume, held rotation, clinical progression, historical bypass, ownership guard' AS verification;
ROLLBACK;
