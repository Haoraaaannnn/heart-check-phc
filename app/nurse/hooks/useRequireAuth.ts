/**
 * @fileoverview nurse workstation authorization using the shared, non-destructive staff guard.
 * @remarks Server proxy checks and Supabase RLS remain authoritative.
 */
'use client';
import { useStaffAuthorization } from '@/hooks/useStaffAuthorization';

/** @returns True until the workstation's permitted staff role is verified. */
export function useRequireAuth(): boolean {
  return useStaffAuthorization(['nurse', 'staff', 'doctor', 'admin', 'superadmin']);
}
export default useRequireAuth;
