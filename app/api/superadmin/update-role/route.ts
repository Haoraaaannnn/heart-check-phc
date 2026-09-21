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

    const { authId, email, username, role, cubicleIds, serviceAssignments, roomAssignments, counterAssignments } = await request.json()

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

      if (Array.isArray(cubicleIds) && cubicleIds.length > 0 && (role === 'nurse' || role === 'staff' || role === 'doctor')) {
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

  if (
    serviceAssignments !== undefined ||
    roomAssignments !== undefined ||
    counterAssignments !== undefined
  ) {
    const { error: serviceDeleteError } = await supabaseAdmin
      .from('user_services')
      .delete()
      .eq('user_id', userRow.id);

    if (serviceDeleteError) {
      console.error('user_services delete error:', serviceDeleteError);
      throw new Error(serviceDeleteError.message);
    }

    const { error: roomDeleteError } = await supabaseAdmin
      .from('user_rooms')
      .delete()
      .eq('user_id', userRow.id);

    if (roomDeleteError) {
      console.error('user_rooms delete error:', roomDeleteError);
      throw new Error(roomDeleteError.message);
    }

    const { error: counterDeleteError } = await supabaseAdmin
      .from('user_counters')
      .delete()
      .eq('user_id', userRow.id);

    if (counterDeleteError) {
      console.error('user_counters delete error:', counterDeleteError);
      throw new Error(counterDeleteError.message);
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
          throw new Error(error.message);
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
          throw new Error(error.message);
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
          throw new Error(error.message);
        }
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