/**
 * @fileoverview Compatibility export for the shared staff inactivity countdown.
 * @remarks StaffSessionProvider owns the single timer; tab activity is shared across workstations.
 */
'use client';
/** @remarks StaffSessionProvider enforces inactivity once for all staff routes. */
export function useIdleTimeout(): void { /* Compatibility shim; no per-page or per-tab timer. */ }
export default useIdleTimeout;
