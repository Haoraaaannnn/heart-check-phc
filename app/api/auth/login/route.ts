import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_LOCKOUT_MS = 30 * 1000

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
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

    return NextResponse.json({
      session: signInData.session,
      user: signInData.user,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown login error';
    console.error('[LOGIN SERVER ERROR]:', message);
    return NextResponse.json({ error: 'Authentication service temporarily unavailable.' }, { status: 500 });
  }
}