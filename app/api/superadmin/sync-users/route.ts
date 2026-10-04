/**
 * @fileoverview SuperAdmin User Directory Synchronization Route Handler.
 *
 * Reconciles the Supabase Auth internal user directory with the operational
 * application `users` table, ensuring every authenticated credential possesses
 * a corresponding role and metadata record in public storage.
 *
 * Security Considerations (SEC-026 / SEC-AUD-003):
 * - Enforces zero-trust authorization: Must be invoked with valid superadmin session
 *   bearer token via `requireSuperadmin`.
 * - Employs elevated Service Role Key strictly server-side for directory reconciliation.
 * - Sanitizes error responses to prevent internal database schema or credential leakage.
 *
 * @module app/api/superadmin/sync-users/route
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Synchronizes Supabase Auth users into the application users table.
 * Restricted strictly to verified SuperAdmin callers.
 *
 * @param request - Next.js Request object carrying Authorization Bearer token.
 * @returns NextResponse with synchronization metrics or error envelope.
 */
export async function POST(request: Request) {
  try {
    // Enforce SuperAdmin access control guard
    const guard = await requireSuperadmin(request);
    if (!guard.authorized) {
      return guard.response;
    }

    // Retrieve full Auth user list via service role
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('[SYNC USERS] Auth admin listUsers error:', authError.message);
      return NextResponse.json({ error: 'Failed to query authentication directory.' }, { status: 500 });
    }

    // Retrieve existing application users table records
    const { data: existingUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, auth_id');

    if (dbError) {
      console.error('[SYNC USERS] Database query error:', dbError.message);
      return NextResponse.json({ error: 'Failed to query application user registry.' }, { status: 500 });
    }

    const existingAuthIds = new Set(
      existingUsers?.flatMap((u) => [u.id, u.auth_id]).filter(Boolean)
    );

    const missingUsers = authUsers.users.filter(
      (user) => !existingAuthIds.has(user.id)
    );

    let insertCount = 0;
    for (const user of missingUsers) {
      const { error: insertError } = await supabaseAdmin.from('users').insert({
        auth_id: user.id,
        email: user.email,
        username: user.email?.split('@')[0],
        role: 'registration',
      });

      if (insertError) {
        console.error(`[SYNC USERS] Failed to insert user ${user.id}:`, insertError.message);
      } else {
        insertCount++;
      }
    }

    return NextResponse.json({
      message: `Successfully synchronized ${insertCount} user accounts.`,
      synced: insertCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('[SYNC USERS SERVER ERROR]:', message);
    return NextResponse.json({ error: 'Internal user sync service error.' }, { status: 500 });
  }
}