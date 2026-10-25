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

    const {
      authId,
      userId,
      email,
      username,
      role,
      cubicleIds,
      serviceAssignments,
      roomAssignments,
      counterAssignments,
      workstationAccess,
    } = await request.json()

    if (!authId && !userId) {
      return NextResponse.json(
        { error: 'User identifier (Auth ID or User ID) is required' },
        { status: 400 }
      )
    }

    if (authId && authId === guard.user.id && role && role !== 'superadmin') {
      return NextResponse.json(
        { error: 'You cannot change your own role away from superadmin' },
        { status: 400 }
      )
    }

    let userRow: { id: number | string; email?: string; auth_id?: string } | null = null;

    if (userId) {
      const { data: u } = await supabaseAdmin.from('users').select('id, email, auth_id').eq('id', userId).maybeSingle();
      if (u) userRow = u;
    }

    if (!userRow && authId) {
      const { data: u } = await supabaseAdmin.from('users').select('id, email, auth_id').eq('auth_id', authId).maybeSingle();
      if (u) userRow = u;
    }

    if (!userRow && email) {
      const { data: u } = await supabaseAdmin.from('users').select('id, email, auth_id').ilike('email', email).maybeSingle();
      if (u) userRow = u;
    }

    if (!userRow && authId) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authId);
      if (authUser?.user?.email) {
        const { data: userByEmail } = await supabaseAdmin
          .from('users')
          .select('id, email, auth_id')
          .ilike('email', authUser.user.email)
          .maybeSingle();
        if (userByEmail) {
          userRow = userByEmail;
        }
      }
    }

    if (!userRow) {
      return NextResponse.json({ error: 'User account not found in directory.' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email: email,
        username: username,
        role: role,
        ...(authId ? { auth_id: authId } : {}),
      })
      .eq('id', userRow.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const targetAuthId = authId || userRow.auth_id;
    if (targetAuthId) {
      const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(targetAuthId);
      const existingMeta = existingAuth?.user?.user_metadata || {};
      const updatePayload: Record<string, unknown> = {
        user_metadata: {
          ...existingMeta,
          role: role || existingMeta.role,
          ...(workstationAccess !== undefined ? { allowed_workstations: workstationAccess } : {}),
        },
      };
      if (email) {
        updatePayload.email = email;
      }
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetAuthId, updatePayload);
      if (authError) {
        console.error('Error updating auth user metadata:', authError);
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

    if (role === 'registration') {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 })
  }
}