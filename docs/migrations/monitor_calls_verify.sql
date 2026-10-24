-- Verifies cooldowns, per-staff limits, and public-data isolation without committing calls.
BEGIN;
DO $$
DECLARE actor uuid := gen_random_uuid(); accepted boolean; i integer;
BEGIN
  IF has_table_privilege('anon', 'public.monitor_calls', 'SELECT')
    OR has_table_privilege('authenticated', 'public.monitor_calls', 'SELECT') THEN
    RAISE EXCEPTION 'FAIL: internal call records are publicly readable';
  END IF;
  IF has_function_privilege('authenticated', 'public.enqueue_monitor_call(bigint,uuid,text,text,integer,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: clients can bypass call authorization';
  END IF;
  SELECT public.enqueue_monitor_call(-900001, actor, 'Test', NULL, NULL, NULL, 'TEST', 'Test call') INTO accepted;
  IF NOT accepted THEN RAISE EXCEPTION 'FAIL: first call not accepted'; END IF;
  SELECT public.enqueue_monitor_call(-900001, actor, 'Test', NULL, NULL, NULL, 'TEST', 'Test call') INTO accepted;
  IF accepted THEN RAISE EXCEPTION 'FAIL: repeated click bypassed cooldown'; END IF;
  FOR i IN 1..11 LOOP
    SELECT public.enqueue_monitor_call(-900001 - i, actor, 'Test', NULL, NULL, NULL, 'TEST', 'Test call') INTO accepted;
    IF NOT accepted THEN RAISE EXCEPTION 'FAIL: valid call was rejected before rate limit'; END IF;
  END LOOP;
  SELECT public.enqueue_monitor_call(-900099, actor, 'Test', NULL, NULL, NULL, 'TEST', 'Test call') INTO accepted;
  IF accepted THEN RAISE EXCEPTION 'FAIL: staff call rate limit bypassed'; END IF;
  IF EXISTS(SELECT 1 FROM public.monitor_calls WHERE actor_id = actor AND
    (expires_at <= created_at OR expires_at > created_at + interval '91 seconds')) THEN
    RAISE EXCEPTION 'FAIL: calls have invalid expiry';
  END IF;
END;
$$;
SELECT 'PASS: call insertion, repeat-click cooldown, per-staff rate limit, expiry, private table and function access' AS verification;
ROLLBACK;
