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

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }
    if (!guard.user.email) {
      return NextResponse.json({ error: 'Account has no email on file.' }, { status: 400 })
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: guard.user.email,
      password: currentPassword,
    })
    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(guard.user.id, { password: newPassword })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabaseAdmin.auth.admin.signOut(guard.token, 'others')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}