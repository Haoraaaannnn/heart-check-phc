/**
 * @fileoverview Staff Authentication Logout endpoint (/api/auth/logout).
 *
 * Terminates authenticated sessions across Philippine Heart Center workstations,
 * invalidating Supabase tokens and destroying session cookies with zero-lifetime flags.
 *
 * @remarks
 * Conforms strictly to AGENTS.md secure coding standards:
 * - Destroys all Supabase session cookies (`sb-*`) by explicitly setting `maxAge: 0`.
 * - Employs `Cache-Control: no-store` to prevent caching of auth state.
 * - Zero emojis in code and documentation.
 *
 * @module app/api/auth/logout/route
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Handles POST requests to terminate the active session and revoke cookies.
 *
 * @returns JSON response indicating successful sign-out.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Revoke Supabase auth session
    await supabase.auth.signOut();

    // Explicitly destroy all session cookies matching Supabase prefix
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.set(cookie.name, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    });

    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown logout error';
    console.error('[LOGOUT SERVER ERROR]:', message);
    return NextResponse.json(
      { error: 'Failed to terminate session cleanly.' },
      { status: 500 }
    );
  }
}
