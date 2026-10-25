import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import { getDefaultWorkstationsForRole } from '@/constants/workstations';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERVICES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening',
];
const CONSULTATION_SUBCATEGORIES = ['Pedia', 'Adult'];

export async function GET(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  const { searchParams } = new URL(request.url);
  const authId = searchParams.get('authId');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const { data: cubicles, error: cubicleError } = await supabaseAdmin
    .from('cubicle')
    .select('category, subcategory, room');

  const { data: serviceRows } = await supabaseAdmin
    .from('services')
    .select('label_en')
    .order('display_order', { ascending: true });

  const dynamicServices = (serviceRows && serviceRows.length > 0)
    ? serviceRows.map(s => s.label_en)
    : SERVICES;

  const { data: counterRows } = await supabaseAdmin
    .from('counters').select('counter_number').eq('active', true).order ('counter_number');
    const COUNTERS = (counterRows ?? []).map(c => c.counter_number);

  if (cubicleError) {
    return NextResponse.json({ error: cubicleError.message }, { status: 400 });
  }

  const seen = new Set<string>();
  const availableRooms: { service: string; subcategory: string | null; room: number }[] = [];
  for (const c of cubicles ?? []) {
    const key = `${c.category}::${c.subcategory ?? ''}::${c.room}`;
    if (!seen.has(key)) {
      seen.add(key);
      availableRooms.push({ service: c.category, subcategory: c.subcategory ?? null, room: c.room });
    }
  }
  availableRooms.sort((a, b) =>
    a.service.localeCompare(b.service) ||
    (a.subcategory ?? '').localeCompare(b.subcategory ?? '') ||
    a.room - b.room
  );

  let assignedServices: string[] = [];
  let assignedRooms: { service: string; subcategory: string | null; room: number }[] = [];
  let assignedCounters: number[] = [];
  let allowedWorkstations: string[] = [];

  let user: { id: number | string; email?: string; auth_id?: string; role?: string } | null = null;

  if (userId) {
    const { data: userById } = await supabaseAdmin
      .from('users').select('id, email, auth_id, role').eq('id', userId).maybeSingle();
    if (userById) user = userById;
  }

  if (!user && authId) {
    const { data: userByAuth } = await supabaseAdmin
      .from('users').select('id, email, auth_id, role').eq('auth_id', authId).maybeSingle();
    if (userByAuth) user = userByAuth;
  }

  if (!user && email) {
    const { data: userByEmail } = await supabaseAdmin
      .from('users').select('id, email, auth_id, role').ilike('email', email).maybeSingle();
    if (userByEmail) user = userByEmail;
  }

  if (!user && authId) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authId);
    if (authUser?.user?.email) {
      const { data: userByAuthEmail } = await supabaseAdmin
        .from('users').select('id, email, auth_id').ilike('email', authUser.user.email).maybeSingle();
      if (userByAuthEmail) {
        user = userByAuthEmail;
      }
    }
  }

  if (user && authId && (!user as any).auth_id) {
    await supabaseAdmin.from('users').update({ auth_id: authId }).eq('id', user.id);
  }

  if (user) {
        const [
        { data: services, error: servicesError },
        { data: rooms, error: roomsError },
        { data: counters, error: countersError },
        ] = await Promise.all([
        supabaseAdmin
            .from('user_services')
            .select('service')
            .eq('user_id', user.id),

        supabaseAdmin
            .from('user_rooms')
            .select('service, subcategory, room')
            .eq('user_id', user.id),

        supabaseAdmin
            .from('user_counters')
            .select('counter')
            .eq('user_id', user.id),
        ]);

        if (servicesError || roomsError || countersError) {
        console.error({
            servicesError,
            roomsError,
            countersError,
        });

        return NextResponse.json(
            {
            error:
                servicesError?.message ||
                roomsError?.message ||
                countersError?.message ||
                'Unable to load assignments',
            },
            { status: 400 }
        );
        }
        assignedServices = (services ?? []).map(s => s.service);
        assignedRooms = (rooms ?? []) as typeof assignedRooms;
        assignedCounters = (counters ?? []).map(c => c.counter);
    }

  const targetAuthId = authId || user?.auth_id;
  if (targetAuthId) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetAuthId);
    if (authUser?.user?.user_metadata?.allowed_workstations && Array.isArray(authUser.user.user_metadata.allowed_workstations)) {
      allowedWorkstations = authUser.user.user_metadata.allowed_workstations;
    } else if (user?.role) {
      allowedWorkstations = getDefaultWorkstationsForRole(user.role);
    }
  } else if (user?.role) {
    allowedWorkstations = getDefaultWorkstationsForRole(user.role);
  }

  return NextResponse.json({
    services: dynamicServices,
    consultationSubcategories: CONSULTATION_SUBCATEGORIES,
    counters: COUNTERS,
    availableRooms,
    assignedServices,
    assignedRooms,
    assignedCounters,
    allowedWorkstations,
  });
}