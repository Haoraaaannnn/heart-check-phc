import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_ATTEMPTS = 10
const LOCKOUT_MS = 3 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const now = Date.now()

    const { data: attemptRow } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (attemptRow?.locked_until) {
      const lockedUntilMs = new Date(attemptRow.locked_until).getTime()
      if (lockedUntilMs > now) {
        const secondsRemaining = Math.ceil((lockedUntilMs - now) / 1000)
        return NextResponse.json({ error: 'locked', secondsRemaining }, { status: 429 })
      }
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
          attempt_count: 0,
          locked_until: new Date(now + LOCKOUT_MS).toISOString(),
          updated_at: new Date().toISOString(),
        })
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
      })

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await supabaseAdmin.from('login_attempts').upsert({
      email: normalizedEmail,
      attempt_count: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      session: signInData.session,
      user: signInData.user,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}