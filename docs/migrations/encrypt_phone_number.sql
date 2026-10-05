-- ==============================================================================
-- Migration: Encrypt Patient Phone Number & Convert Schema to Text
-- Description: Alters the `phoneNum` column in the `patients` table from `bigint`
--              to `text` to enable storing AES-256-GCM encrypted ciphertext tokens.
--              Also updates the `create_patient` stored procedure signature and body.
-- Target: Supabase PostgreSQL (Run in Supabase Dashboard SQL Editor)
-- Date: 2026-10-05
-- ==============================================================================

-- 1. Safely alter patients.phoneNum from bigint (int8) to text
ALTER TABLE public.patients
  ALTER COLUMN "phoneNum" TYPE text
  USING "phoneNum"::text;

-- Comment on column documenting AES-256-GCM encryption format
COMMENT ON COLUMN public.patients."phoneNum" IS
  'Encrypted patient mobile phone number stored as AES-256-GCM ciphertext payload (enc:v1:<iv>:<tag>:<ciphertext>) or legacy normalized phone string.';

-- 2. Drop existing create_patient function with old bigint parameter signature
DROP FUNCTION IF EXISTS public.create_patient(
  text,
  text,
  text[],
  text,
  boolean,
  bigint
);

-- Also drop overloaded variant with integer if one exists
DROP FUNCTION IF EXISTS public.create_patient(
  text,
  text,
  text[],
  text,
  boolean,
  text
);

-- 3. Recreate create_patient with p_phone typed as text
CREATE OR REPLACE FUNCTION public.create_patient(
  p_service text,
  p_subcategory text DEFAULT NULL,
  p_preferred_cubicles text[] DEFAULT NULL,
  p_prefix text DEFAULT 'C',
  p_group_by_subcategory boolean DEFAULT false,
  p_phone text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  "patientNum" text,
  queue_position integer,
  service text,
  "phoneNum" text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_num integer := 1;
  v_patient_num text;
  v_next_queue_pos integer := 1;
  v_start_of_day timestamptz;
  v_last_patient_num text;
  v_counter_part text;
  v_inserted_id bigint;
BEGIN
  -- Compute start of current day in Manila time (+08:00)
  v_start_of_day := date_trunc('day', timezone('Asia/Manila', now()));

  -- Find the highest queue number generated today for this service / subcategory
  IF p_group_by_subcategory AND p_subcategory IS NOT NULL THEN
    SELECT p."patientNum" INTO v_last_patient_num
    FROM public.patients p
    WHERE p.service = p_service
      AND p.subcategory = p_subcategory
      AND p.created_at >= v_start_of_day
    ORDER BY p.created_at DESC
    LIMIT 1;
  ELSE
    SELECT p."patientNum" INTO v_last_patient_num
    FROM public.patients p
    WHERE p.service = p_service
      AND p.created_at >= v_start_of_day
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  -- Extract numeric increment
  IF v_last_patient_num IS NOT NULL THEN
    v_counter_part := substring(v_last_patient_num from (length(p_prefix) + 1));
    IF v_counter_part ~ '^[0-9]+$' THEN
      v_next_num := (v_counter_part::integer) + 1;
    END IF;
  END IF;

  -- Format the new ticket code (e.g. C001, 1001, 4001)
  v_patient_num := p_prefix || lpad(v_next_num::text, 3, '0');

  -- Calculate next available queue position
  SELECT COALESCE(MAX(p.queue_position), 0) + 1 INTO v_next_queue_pos
  FROM public.patients p
  WHERE p.created_at >= v_start_of_day;

  -- Insert new patient ticket record with encrypted phone string
  INSERT INTO public.patients (
    "patientNum",
    service,
    status,
    "phoneNum",
    "cubicleNum",
    queue_position,
    subcategory,
    "preferredCubicleNums",
    is_historical,
    created_at,
    updated_at
  )
  VALUES (
    v_patient_num,
    p_service,
    'On Progress',
    p_phone,
    NULL,
    v_next_queue_pos,
    p_subcategory,
    p_preferred_cubicles,
    false,
    now(),
    now()
  )
  RETURNING patients.id INTO v_inserted_id;

  -- Return the created patient record summary
  RETURN QUERY
  SELECT
    p.id,
    p."patientNum",
    p.queue_position,
    p.service,
    p."phoneNum"
  FROM public.patients p
  WHERE p.id = v_inserted_id;
END;
$$;

-- Grant execution privilege to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_patient(
  text,
  text,
  text[],
  text,
  boolean,
  text
) TO anon, authenticated, service_role;
