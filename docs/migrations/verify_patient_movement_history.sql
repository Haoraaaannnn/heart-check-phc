-- Read-only activation checks. This verifies installed objects and privileges, not a live patient workflow.
BEGIN READ ONLY;
DO $$
BEGIN
  IF to_regclass('public.patient_movement_history') IS NULL THEN
    RAISE EXCEPTION 'Patient history table is not installed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.patient_movement_history'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'Patient history RLS is disabled';
  END IF;
  IF has_table_privilege('anon', 'public.patient_movement_history', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
    OR has_table_privilege('authenticated', 'public.patient_movement_history', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
    OR has_table_privilege('service_role', 'public.patient_movement_history', 'INSERT,UPDATE,DELETE,TRUNCATE') THEN
    RAISE EXCEPTION 'Patient history privileges exceed the read-only server contract';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.patient_movement_history', 'SELECT') THEN
    RAISE EXCEPTION 'Patient history server reads are unavailable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'capture_patient_movement'
    AND tgrelid = 'public.patients'::regclass AND tgenabled = 'O')
    OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'capture_patient_call_history'
      AND tgrelid = 'public.monitor_calls'::regclass AND tgenabled = 'O')
    OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reject_patient_history_rewrite'
      AND tgrelid = 'public.patient_movement_history'::regclass AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'Patient history triggers are missing or disabled';
  END IF;
  RAISE NOTICE 'Patient history objects and privileges verified. A supervised test ticket is still required to verify the deployed workflow.';
END;
$$;
COMMIT;
