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

    const { email, password, username, role, cubicleIds, serviceAssignments, roomAssignments, counterAssignments } = await request.json()

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

    if (Array.isArray(cubicleIds) && cubicleIds.length > 0 && (role === 'nurse' || role === 'staff' || role === 'doctor')) {
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

  if (role === 'registration') {
    if (Array.isArray(serviceAssignments) && serviceAssignments.length > 0) {
      const { error } = await supabaseAdmin
        .from('user_services')
        .insert(
          serviceAssignments.map((service: string) => ({
            user_id: userRow.id,
            service,
          }))
        );

      if (error) {
        console.error('user_services insert error:', error);
        return NextResponse.json(
          { error: `Service assignment failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    if (Array.isArray(roomAssignments) && roomAssignments.length > 0) {
      const { error } = await supabaseAdmin
        .from('user_rooms')
        .insert(
          roomAssignments.map(
            (r: {
              service: string;
              subcategory: string | null;
              room: number;
            }) => ({
              user_id: userRow.id,
              service: r.service,
              subcategory: r.subcategory,
              room: r.room,
            })
          )
        );

      if (error) {
        console.error('user_rooms insert error:', error);
        return NextResponse.json(
          { error: `Room assignment failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    if (Array.isArray(counterAssignments) && counterAssignments.length > 0) {
      const { error } = await supabaseAdmin
        .from('user_counters')
        .insert(
          counterAssignments.map((counter: number) => ({
            user_id: userRow.id,
            counter,
          }))
        );

      if (error) {
        console.error('user_counters insert error:', error);
        return NextResponse.json(
          { error: `Counter assignment failed: ${error.message}` },
          { status: 400 }
        );
      }
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