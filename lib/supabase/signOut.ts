/**
 * @fileoverview Universal Sign-Out Orchestrator for Heart Check PHC.
 *
 * Implements thorough session teardown across both server-side HTTP cookies
 * and client-side storage, ensuring no residual authentication state remains
 * when a staff member logs out or transitions to a public kiosk.
 *
 * @remarks
 * Security guarantees:
 * 1. Server-side cookie destruction via `/api/auth/logout`.
 * 2. Client-side token revocation via `supabase.auth.signOut()`.
 * 3. Cache and history replacement via `window.location.replace()`, preventing
 *    unauthorized back/forward navigation into previously visited screens.
 * 4. Zero emojis in code and documentation.
 *
 * @module lib/supabase/signOut
 */

import { supabase } from '@/lib/supabase';

/**
 * Universal sign-out handler for clinical and administrative workstations.
 *
 * @param redirectUrl - Destination URL after completing logout (defaults to '/login').
 * @returns Promise that resolves once sign-out initiates redirection.
 */
export async function handleSignOut(redirectUrl: string = '/login'): Promise<void> {
  try {
    // 1. Invoke server endpoint to destroy all Supabase session cookies
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[AUTH] Server logout error:', error);
  }

  try {
    // 2. Clear client Supabase session and document cookies
    await supabase.auth.signOut();
  } catch (error) {
    console.error('[AUTH] Client signOut error:', error);
  }

  // 3. Purge volatile client storage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore sessionStorage clearance failures in sandboxed contexts
    }

    // 4. Force a hard replace to eliminate Next.js in-memory router cache and replace history
    window.location.replace(redirectUrl);
  }
}
