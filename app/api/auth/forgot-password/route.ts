import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_PER_WINDOW = 3
const WINDOW_MS = 60 * 60 * 1000
const MIN_GAP_MS = 60 * 1000

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const now = Date.now()

    const { data: row } = await supabaseAdmin
      .from('password_reset_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    let shouldSend = true

    if (row) {
      const windowStart = new Date(row.window_start).getTime()
      const updatedAt = new Date(row.updated_at).getTime()
      const withinWindow = now - windowStart < WINDOW_MS

      if (now - updatedAt < MIN_GAP_MS) {
        shouldSend = false
      } else if (withinWindow && row.request_count >= MAX_PER_WINDOW) {
        shouldSend = false
      }

      await supabaseAdmin.from('password_reset_attempts').upsert({
        email: normalizedEmail,
        request_count: withinWindow ? row.request_count + 1 : 1,
        window_start: withinWindow ? row.window_start : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else {
      await supabaseAdmin.from('password_reset_attempts').insert({
        email: normalizedEmail,
        request_count: 1,
        window_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (shouldSend) {
      const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabaseAnon.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}