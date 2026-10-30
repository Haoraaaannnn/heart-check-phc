/** @fileoverview Rate-limited staff login with one server-owned session cookie handoff. */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { syncDoctorAccounts } from '@/lib/doctors/syncAccounts'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_LOCKOUT_MS = 30 * 1000

/** @returns Role confirmation with session cookies, or a bounded authentication error. */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null)
    const email: unknown = typeof body === 'object' && body !== null && 'email' in body ? body.email : null
    const password: unknown = typeof body === 'object' && body !== null && 'password' in body ? body.password : null
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const now = Date.now()

    const [{ data: maxAttemptsRow }, { data: lockoutRow }] = await Promise.all([
      supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'max_login_attempts')
        .maybeSingle(),
      supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'login_lockout_seconds')
        .maybeSingle(),
    ])

    const parsedMaxAttempts = maxAttemptsRow ? parseInt(maxAttemptsRow.value, 10) : NaN
    const MAX_ATTEMPTS =
      !isNaN(parsedMaxAttempts) && parsedMaxAttempts > 0 ? parsedMaxAttempts : DEFAULT_MAX_ATTEMPTS

    const parsedLockoutSeconds = lockoutRow ? parseInt(lockoutRow.value, 10) : NaN
    const LOCKOUT_MS =
      !isNaN(parsedLockoutSeconds) && parsedLockoutSeconds > 0
        ? parsedLockoutSeconds * 1000
        : DEFAULT_LOCKOUT_MS

    const { data: attemptRow } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (attemptRow?.locked_until) {
      const lockedUntilMs = new Date(attemptRow.locked_until).getTime()
      if (lockedUntilMs > now) {
        const secondsRemaining = Math.ceil((lockedUntilMs - now) / 1000)
        return NextResponse.json({ error: 'locked', secondsRemaining }, { status: 429 })
      }
    }

    const isSecure =
      request.headers.get('x-forwarded-proto') === 'https' ||
      new URL(request.url).protocol === 'https:'

    const cookieStore = await cookies()

    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (!value || options?.maxAge === 0) {
                cookieStore.set(name, '', {
                  path: '/',
                  maxAge: 0,
                  expires: new Date(0),
                  sameSite: 'lax',
                  secure: isSecure,
                })
              } else {
                const sessionOptions = { ...options }
                delete sessionOptions.maxAge
                delete sessionOptions.expires
                cookieStore.set(name, value, {
                  ...sessionOptions,
                  path: '/',
                  sameSite: 'lax',
                  secure: isSecure,
                })
              }
            })
          },
        },
      }
    )

    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (signInError || !signInData.session) {
      const newCount = (attemptRow?.attempt_count ?? 0) + 1

      if (newCount >= MAX_ATTEMPTS) {
        await supabaseAdmin.from('login_attempts').upsert({
          email: normalizedEmail,
          attempt_count: newCount,
          locked_until: new Date(now + LOCKOUT_MS).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' })
        return NextResponse.json(
          { error: 'locked', secondsRemaining: Math.ceil(LOCKOUT_MS / 1000) },
          { status: 429 }
        )
      }

      await supabaseAdmin.from('login_attempts').upsert({
        email: normalizedEmail,
        attempt_count: newCount,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await supabaseAdmin.from('login_attempts').upsert({
      email: normalizedEmail,
      attempt_count: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })

    // Verify user role in users table and link auth_id if needed
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', signInData.user.id)
      .maybeSingle()

    let resolvedRole = userProfile?.role
    if (!resolvedRole) {
      const { data: emailProfile } = await supabaseAdmin
        .from('users')
        .select('role')
        .ilike('email', normalizedEmail)
        .maybeSingle()
      resolvedRole = emailProfile?.role
      if (emailProfile) {
        await supabaseAdmin
          .from('users')
          .update({ auth_id: signInData.user.id })
          .ilike('email', normalizedEmail)
      }
    }

    if (!resolvedRole) {
      return NextResponse.json(
        { error: 'User account active but no workstation role assigned.' },
        { status: 403 }
      )
    }

    let doctorDirectoryWarning: string | undefined
    if (resolvedRole === 'doctor') {
      try { await syncDoctorAccounts({ db: supabaseAdmin, authId: signInData.user.id }) }
      catch {
        doctorDirectoryWarning = 'Signed in, but the doctor directory could not refresh. Reopen Doctors to retry.'
        console.warn('[DOCTOR DIRECTORY] Account linking will be retried when the directory opens.')
      }
    }

    const response = NextResponse.json({
      role: resolvedRole,
      ...(doctorDirectoryWarning ? { warning: doctorDirectoryWarning } : {}),
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch {
    console.error('[LOGIN SERVER ERROR]: Authentication service unavailable.');
    return NextResponse.json({ error: 'Authentication service temporarily unavailable.' }, { status: 500 });
  }
}
