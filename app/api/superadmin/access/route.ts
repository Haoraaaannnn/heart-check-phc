import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';

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

  const authId = new URL(request.url).searchParams.get('authId');

  const { data: cubicles, error: cubicleError } = await supabaseAdmin
    .from('cubicle')
    .select('category, subcategory, room');

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

  if (authId) {
    const { data: user } = await supabaseAdmin
      .from('users').select('id').eq('auth_id', authId).single();

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

        assignedServices = (services ?? []).map(s => s.service);
        assignedRooms = (rooms ?? []) as typeof assignedRooms;
        assignedCounters = (counters ?? []).map(c => c.counter);

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
    }
  }

  return NextResponse.json({
    services: SERVICES,
    consultationSubcategories: CONSULTATION_SUBCATEGORIES,
    counters: COUNTERS,
    availableRooms,
    assignedServices,
    assignedRooms,
    assignedCounters,
  });
}