-- Repair encrypted contacts while preserving the live ticket function, return shape and permissions.
-- Run after older phone/prefix migrations. No SMS is sent and no patient rows are deleted.
BEGIN;
ALTER TABLE public.patients ALTER COLUMN "phoneNum" DROP DEFAULT;
ALTER TABLE public.patients ALTER COLUMN "phoneNum" TYPE text USING "phoneNum"::text;
COMMENT ON COLUMN public.patients."phoneNum" IS
  'AES-256-GCM enc:v1 contact tokens for new records; existing legacy values are retained.';

-- Change only the incompatible cast in the existing function. Keep its numbering, locking and ACLs.
DO $repair$
DECLARE
  ticket_function oid := to_regprocedure('public.create_patient(text,text,text[],text,boolean,text)');
  original_definition text;
  repaired_definition text;
BEGIN
  IF ticket_function IS NULL THEN
    RAISE EXCEPTION 'Expected text-parameter create_patient function is missing; no changes applied';
  END IF;
  SELECT pg_get_functiondef(ticket_function) INTO original_definition;
  repaired_definition := regexp_replace(original_definition,
    'p_phone[[:space:]]*::[[:space:]]*(bigint|int8)', 'p_phone', 'gi');
  IF repaired_definition IS DISTINCT FROM original_definition THEN
    EXECUTE repaired_definition;
  END IF;
END;
$repair$;

-- Reject new plaintext contacts without rewriting existing legacy or historical records.
CREATE OR REPLACE FUNCTION public.guard_encrypted_patient_phone()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $guard$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."phoneNum" IS NOT DISTINCT FROM OLD."phoneNum" THEN RETURN NEW; END IF;
  IF NEW."phoneNum" IS NOT NULL AND NEW."phoneNum" <> '' AND
     NEW."phoneNum" !~ '^enc:v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]{22,26}$' THEN
    RAISE EXCEPTION 'Encrypted phone contact is required' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$guard$;
REVOKE ALL ON FUNCTION public.guard_encrypted_patient_phone() FROM PUBLIC;
DROP TRIGGER IF EXISTS guard_encrypted_patient_phone ON public.patients;
CREATE TRIGGER guard_encrypted_patient_phone BEFORE INSERT OR UPDATE OF "phoneNum" ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.guard_encrypted_patient_phone();
NOTIFY pgrst, 'reload schema';
COMMIT;
