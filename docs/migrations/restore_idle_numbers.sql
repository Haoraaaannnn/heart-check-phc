-- Restore recoverable Idle Numbers without deleting, reactivating, or rewriting patient records.
-- Run after shift_queue_rotation.sql when reverting to the idle workflow.
BEGIN;
DROP TRIGGER IF EXISTS enforce_shift_rotation ON public.patients;
DROP FUNCTION IF EXISTS public.enforce_shift_rotation();
DROP FUNCTION IF EXISTS public.reset_queue_shift();
-- Keep current_queue_shift() as a harmless time helper for any existing dependencies.
-- Keep rotation_shift_started_at as historical metadata; the idle workflow does not read it.
-- Keep station-break guards, clinical RLS policies and counter handoff functions unchanged.
COMMIT;
