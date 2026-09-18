import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSuperadmin } from '@/lib/supabase/superadminGuard'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {

    const guard = await requireSuperadmin(request)
    if (!guard.authorized) return guard.response

    const { email, password, username, role, cubicleIds } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email: email,
        username: username || email.split('@')[0],
        role: role || 'registration'
      })
      .select('id')
      .single()

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    if (Array.isArray(cubicleIds) && cubicleIds.length > 0 && (role === 'nurse' || role === 'staff')) {
      const rows = cubicleIds.map((cubicle_id: number) => ({
        user_id: userRow.id,
        cubicle_id,
      }))
      const { error: cubicleError } = await supabaseAdmin
        .from('user_cubicles')
        .insert(rows)

      if (cubicleError) {
        return NextResponse.json(
          { success: true, user: authData.user, warning: `User created, but cubicle assignment failed: ${cubicleError.message}` },
          { status: 201 }
        )
      }
    }

    return NextResponse.json(
      { success: true, user: authData.user },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}