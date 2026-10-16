/**
 * @file route.ts
 * @description REST API route for reading and upserting rows in the `app_settings` table.
 *
 * Endpoint: /api/superadmin/settings
 *
 * Supported methods:
 *   GET  - Returns all app_settings key-value pairs as a plain object using the
 *          anonymous Supabase client (respects RLS; public settings are readable).
 *   PUT  - Upserts a single {key, value} pair using the Supabase service-role
 *          admin client, which bypasses RLS to guarantee writes succeed.
 *          Requires a valid authenticated user session (Bearer token).
 *
 * @remarks
 * The service-role key (SUPABASE_SERVICE_ROLE_KEY) is consumed exclusively on
 * the server side via facilityHelpers.supabaseAdmin. It is never exposed to
 * client bundles or NEXT_PUBLIC_ environment variables, satisfying AGENTS.md rule 12.
 *
 * Cross-service calls are bounded by a 10-second AbortController timeout on the
 * caller side (adminApi helper). This route itself is synchronous within
 * Next.js route constraints.
 *
 * @module app/api/superadmin/settings
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/authGuard';

/**
 * Service-role admin client used exclusively for write operations.
 *
 * @remarks
 * Bypasses Row Level Security. Must never be exposed to client bundles.
 * Only instantiated server-side within this route module.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Anonymous (anon-key) client used for read operations.
 *
 * @remarks
 * RLS policies govern which rows are visible to unauthenticated callers.
 * Using the anon client for reads avoids unnecessarily elevating privileges.
 */
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/superadmin/settings
 *
 * Fetches all rows from `app_settings` and returns them as a flat
 * `{ [key: string]: string }` object for easy client-side lookup.
 *
 * @param _request - Incoming Next.js request (unused; no auth required for reads).
 * @returns JSON response `{ settings: Record<string, string> }` with HTTP 200,
 *          or `{ error: string }` with HTTP 500 on database failure.
 */
export async function GET(_request: Request): Promise<NextResponse> {
  const { data, error } = await supabaseAnon
    .from('app_settings')
    .select('key, value');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

/**
 * PUT /api/superadmin/settings
 *
 * Upserts a single app_settings row identified by `key`.
 * Uses the admin (service-role) client to guarantee the write is not blocked by RLS.
 *
 * @param request - Incoming Next.js request containing a JSON body with shape
 *                  `{ key: string; value: string }`.
 * @returns JSON response `{ success: true }` with HTTP 200 on success,
 *          `{ error: string }` with HTTP 400 on validation failure,
 *          `{ error: string }` with HTTP 401 if the caller is unauthenticated,
 *          or `{ error: string }` with HTTP 500 on database failure.
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const guard = await requireUser(request);
  if (!guard.authorized) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { key, value } = body as { key?: unknown; value?: unknown };

  if (typeof key !== 'string' || key.trim() === '') {
    return NextResponse.json({ error: 'Field "key" must be a non-empty string.' }, { status: 400 });
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'Field "value" must be a string.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert(
      { key: key.trim(), value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
