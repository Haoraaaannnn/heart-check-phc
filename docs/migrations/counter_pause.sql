-- Persist registration timer holds across workstations and reloads.
-- Existing restrictive patient policies continue to protect historical records.
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS counter_paused_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.patients.counter_paused_at IS
  'Freezes the current registration patient timer until staff resumes it.';
