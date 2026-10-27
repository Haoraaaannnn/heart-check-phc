/** @fileoverview Superadmin account provisioning with server-generated thesis credentials. */
import { randomBytes } from 'node:crypto'
import { accountEmail, isAccountRole } from '@/lib/accountCredentials'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSuperadmin } from '@/lib/supabase/superadminGuard'
import { hasValidAssignments, isRecord } from './input'

import { getDefaultWorkstationsForRole } from '@/constants/workstations'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) throw new Error('Account service configuration is missing')
const supabaseAdmin = createClient(supabaseUrl, serviceKey)

/** @param request - Authorized account details. @returns Creation result and credentials for the superadmin. */
export async function POST(request: Request) {
  try {

    const guard = await requireSuperadmin(request)
    if (!guard.authorized) return guard.response

    const body: unknown = await request.json()
    if (!isRecord(body) || !hasValidAssignments(body)) return NextResponse.json({ error: 'Invalid account assignments' }, { status: 400 })
    const {
      username,
      role,
      cubicleIds,
      serviceAssignments,
      roomAssignments,
      counterAssignments,
      workstationAccess,
    } = body

    if (typeof username !== 'string' || !isAccountRole(role)) {
      return NextResponse.json(
        { error: 'Username and a valid role are required' },
        { status: 400 }
      )
    }

    const email = accountEmail({ username, role })
    if (!email) return NextResponse.json({ error: 'Use 1–32 letters, numbers, underscores or hyphens; start with a letter or number.' }, { status: 400 })
    const password = `Hc!${randomBytes(24).toString('base64url')}9a`
    const effectiveRole = role
    const effectiveWorkstations = Array.isArray(workstationAccess)
      ? workstationAccess
      : getDefaultWorkstationsForRole(effectiveRole)

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: username.trim().toLowerCase(),
        role: effectiveRole,
        allowed_workstations: effectiveWorkstations,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Account could not be created. This username and role may already exist.' }, { status: 400 })
    }

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email: email,
        username: username.trim().toLowerCase(),
        role: effectiveRole,
      })
      .select('id')
      .single()

    const userId: unknown = userRow?.id
    if (dbError || (typeof userId !== 'number' && typeof userId !== 'string')) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: cleanupError ? 'Profile creation failed and cleanup was incomplete. Review the user list before retrying.' : 'Profile creation failed. Please retry.' }, { status: 400 })
    }

    if (Array.isArray(cubicleIds) && cubicleIds.length > 0 && (role === 'nurse' || role === 'doctor')) {
      const rows = cubicleIds.map((cubicle_id: number) => ({
        user_id: userId,
        cubicle_id,
      }))
      const { error: cubicleError } = await supabaseAdmin
        .from('user_cubicles')
        .insert(rows)

      if (cubicleError) {
        return NextResponse.json(
          { success: true, credentials: { email, password }, warning: 'Account created, but cubicle assignment failed. Edit the account to retry assignments.' },
          { status: 201, headers: { 'Cache-Control': 'no-store' } }
        )
      }
    }

  if (Array.isArray(serviceAssignments) && serviceAssignments.length > 0) {
    const { error } = await supabaseAdmin
      .from('user_services')
      .insert(
        serviceAssignments.map((service: string) => ({
          user_id: userId,
          service,
        }))
      );

    if (error) {
      return NextResponse.json(
        { success: true, credentials: { email, password }, warning: 'Account created, but service assignment failed. Edit the account to retry assignments.' },
        { status: 201, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  if (role === 'registration') {
    if (Array.isArray(roomAssignments) && roomAssignments.length > 0) {
      const { error } = await supabaseAdmin
        .from('user_rooms')
        .insert(
          roomAssignments.map(
            (r: {
              service: string;
              subcategory: string | null;
              room: number;
            }) => ({
              user_id: userId,
              service: r.service,
              subcategory: r.subcategory,
              room: r.room,
            })
          )
        );

      if (error) {
        return NextResponse.json(
          { success: true, credentials: { email, password }, warning: 'Account created, but room assignment failed. Edit the account to retry assignments.' },
          { status: 201, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    if (Array.isArray(counterAssignments) && counterAssignments.length > 0) {
      const { error } = await supabaseAdmin
        .from('user_counters')
        .insert(
          counterAssignments.map((counter: number) => ({
            user_id: userId,
            counter,
          }))
        );

      if (error) {
        return NextResponse.json(
          { success: true, credentials: { email, password }, warning: 'Account created, but counter assignment failed. Edit the account to retry assignments.' },
          { status: 201, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }
  }

    return NextResponse.json(
      { success: true, credentials: { email, password } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid request body.' : 'Account creation failed. Review the user list before retrying.' }, { status: error instanceof SyntaxError ? 400 : 500 })
  }
}
