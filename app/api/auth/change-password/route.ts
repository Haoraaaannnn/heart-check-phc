/** @fileoverview Authenticated self-service password changes with current-password verification. */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/supabase/authGuard'
import { isPasswordLengthAllowed } from '@/lib/passwordPolicy'

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
    const isForcedChange = typeof body === 'object' && body !== null && 'force' in body && body.force === true
    if (!passwords) return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 })
    const { currentPassword, newPassword } = passwords
    if (!isPasswordLengthAllowed(newPassword)) {
      return NextResponse.json({ error: 'New password must be between 8 and 64 characters.' }, { status: 400 })
    }
    if (newPassword === currentPassword) return NextResponse.json({ error: 'Choose a password different from your current password.' }, { status: 400 })
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: 'Password service is unavailable.' }, { status: 503 })
    const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    const supabaseAnon = createClient(url, anonKey, clientOptions)
    const supabaseAdmin = createClient(url, serviceKey, clientOptions)
    const email = guard.user.email
    if (!email) return NextResponse.json({ error: 'Account has no email on file.' }, { status: 400 })
    const { data: verified, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError || verified.user?.id !== guard.user.id) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(guard.user.id)
    if (isForcedChange && authUser.user?.user_metadata?.must_change_password !== true) {
      return NextResponse.json({ error: 'This password change is not required for your account.' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(guard.user.id, { password: newPassword })
    if (error) {
      await supabaseAnon.auth.signOut({ scope: 'local' })
      return NextResponse.json({ error: 'Unable to update password. Choose a different password and try again.' }, { status: 400 })
    }

    if (authUser.user?.user_metadata?.must_change_password === true) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(guard.user.id, {
        user_metadata: { ...authUser.user.user_metadata, must_change_password: false },
      })
      if (metadataError) {
        return NextResponse.json({ success: true, warning: 'Password updated. Sign out and contact your administrator if this prompt appears again.' }, { headers: { 'Cache-Control': 'no-store' } })
      }
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
