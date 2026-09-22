import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/supabase/authGuard'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const guard = await requireUser(request)
    if (!guard.authorized) return guard.response

    const { password } = await request.json()
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(guard.user.id, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (guard.user.email) {
      await supabaseAdmin.from('login_attempts').delete().eq('email', guard.user.email.toLowerCase())
    }
    await supabaseAdmin.auth.admin.signOut(guard.token, 'others')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}