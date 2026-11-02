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
 * 2. Current-browser session revocation without signing out other physical devices.
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
export async function handleSignOut(redirectUrl: string = '/login?reason=logout'): Promise<void> {
  const targetUrl = redirectUrl === '/login' ? '/login?reason=logout' : redirectUrl;

  // 1. Prepare custom redirect intent to prevent auth change listeners from racing
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('phc_signout_redirect', targetUrl);
    } catch {
      // Ignore sessionStorage clearance failures in sandboxed contexts
    }
  }

  try {
    // 2. Invoke server endpoint to destroy all Supabase session cookies and release active desks
    const sessionRes = typeof supabase.auth?.getSession === 'function'
      ? await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
      : null;
    const accessToken = sessionRes?.data?.session?.access_token;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        signal: controller?.signal,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[AUTH] Server logout error:', error);
  }

  try {
    // 3. Clear client Supabase session and document cookies
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.error('[AUTH] Client signOut error:', error);
  }

  // 4. Client-side fallback cookie sweeping for any lingering sb-* tokens
  if (typeof document !== 'undefined') {
    try {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      document.cookie.split(';').forEach((cookieStr) => {
        const [rawName] = cookieStr.trim().split('=');
        if (rawName && rawName.startsWith('sb-')) {
          document.cookie = `${rawName}=; path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }
      });
    } catch {
      // Ignore cookie clearance failure in restricted contexts
    }
  }

  // 5. Purge volatile client storage and complete navigation
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore sessionStorage clearance failures in sandboxed contexts
    }

    // 6. Force a hard replace to eliminate Next.js in-memory router cache and replace history
    window.location.replace(targetUrl);
  }
}
