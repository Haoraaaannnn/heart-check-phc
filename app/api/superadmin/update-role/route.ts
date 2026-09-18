import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSuperadmin } from '@/lib/supabase/superadminGuard'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: Request) {
  try {
    const guard = await requireSuperadmin(request)
    if (!guard.authorized) return guard.response

    const { authId, email, username, role, cubicleIds } = await request.json()

    if (!authId) {
      return NextResponse.json(
        { error: 'Auth ID is required' },
        { status: 400 }
      )
    }

    if (authId === guard.user.id && role && role !== 'superadmin') {
      return NextResponse.json(
        { error: 'You cannot change your own role away from superadmin' },
        { status: 400 }
      )
    }

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        email: email,
        username: username,
        role: role
      })
      .eq('auth_id', authId)
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        authId,
        { email: email }
      )
      if (authError) {
        console.error('Error updating auth email:', authError)
      }
    }

    if (cubicleIds !== undefined) {
      const { error: clearError } = await supabaseAdmin
        .from('user_cubicles')
        .delete()
        .eq('user_id', userRow.id)

      if (clearError) {
        return NextResponse.json(
          { success: true, message: 'User updated, but cubicle assignment failed to reset', warning: clearError.message },
          { status: 200 }
        )
      }

      if (Array.isArray(cubicleIds) && cubicleIds.length > 0 && (role === 'nurse' || role === 'staff')) {
        const rows = cubicleIds.map((cubicle_id: number) => ({
          user_id: userRow.id,
          cubicle_id,
        }))
        const { error: insertError } = await supabaseAdmin
          .from('user_cubicles')
          .insert(rows)

        if (insertError) {
          return NextResponse.json(
            { success: true, message: 'User updated, but cubicle assignment failed', warning: insertError.message },
            { status: 200 }
          )
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'User updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}