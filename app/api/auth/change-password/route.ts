/** @fileoverview Authenticated self-service password changes with current-password verification. */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/supabase/authGuard'

/** @param value - Untrusted request body. @returns Valid password fields or null. */
function parsePasswords(value: unknown): { currentPassword: string; newPassword: string } | null {
  if (typeof value !== 'object' || value === null || !('currentPassword' in value) || !('newPassword' in value)) return null
  if (typeof value.currentPassword !== 'string' || !value.currentPassword || typeof value.newPassword !== 'string' || !value.newPassword) return null
  return { currentPassword: value.currentPassword, newPassword: value.newPassword }
}

/**
 * Changes only the authenticated user's password and revokes other device sessions.
 * @param request - Bearer-authenticated request containing the old and new passwords.
 * @returns Explicit validation, authentication, or update outcome.
 * @remarks Credentials and authentication errors are never logged or echoed.
 */
export async function POST(request: Request) {
  try {
    const guard = await requireUser(request)
    if (!guard.authorized) return guard.response

    const body: unknown = await request.json()
    const passwords = parsePasswords(body)
    if (!passwords) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 })
    }
    const { currentPassword, newPassword } = passwords
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }
    if (newPassword === currentPassword) return NextResponse.json({ error: 'Choose a password different from your current password.' }, { status: 400 })
    if (!guard.user.email) {
      return NextResponse.json({ error: 'Account has no email on file.' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: 'Password service is unavailable.' }, { status: 503 })
    const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    const supabaseAnon = createClient(url, anonKey, clientOptions)
    const supabaseAdmin = createClient(url, serviceKey, clientOptions)
    const { data: verified, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: guard.user.email,
      password: currentPassword,
    })
    if (signInError || verified.user?.id !== guard.user.id) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(guard.user.id, { password: newPassword })
    if (error) {
      await supabaseAnon.auth.signOut({ scope: 'local' })
      return NextResponse.json({ error: 'Unable to update password. Choose a different password and try again.' }, { status: 400 })
    }

    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(guard.token, 'others')
    if (revokeError) {
      await supabaseAnon.auth.signOut({ scope: 'local' })
      return NextResponse.json({ success: true, warning: 'Your password was updated, but other device sessions could not be signed out. Sign out on other devices manually.' }, { headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid request body.' : 'Unable to change password. Please try again.' }, { status: error instanceof SyntaxError ? 400 : 500 })
  }
}
