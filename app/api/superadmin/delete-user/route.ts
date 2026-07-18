import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSuperadmin } from '@/lib/supabase/superadminGuard'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    const guard = await requireSuperadmin(request)
    if (!guard.authorized) return guard.response

    const { authId } = await request.json()

    if (!authId) {
      return NextResponse.json(
        { error: 'Auth ID is required' },
        { status: 400 }
      )
    }

    if (authId === guard.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('auth_id', authId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authId)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}