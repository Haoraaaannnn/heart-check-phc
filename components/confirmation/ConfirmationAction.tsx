'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  serviceId: number;
}

const SERVICE_PREFIXES: Record<string, string> = {
  'Consultation': 'C',
  'OPD Card': 'O',
  'Refill Prescription': 'R',
  'ECG': 'E',
  'Warfarin': 'W',
  'OPD Reschedule': 'S',
  'Benzathine': 'B',
  'OPD Screening': 'P',
};

export default function ConfirmationActions({ serviceId }: Props) {
  const router = useRouter();

const handleContinue = async () => {
  console.log('1. Button clicked');

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('label_en')
      .eq('id', serviceId)
      .single();

    console.log('2. Service:', serviceData, serviceError);

    const serviceName = serviceData?.label_en ?? String(serviceId);
    const prefix = SERVICE_PREFIXES[serviceName] ?? 'C';

    // Get last patient number for this service today
    const { data: lastPatient } = await supabase
      .from('patients')
      .select('patientNum')
      .eq('service', serviceName)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (lastPatient?.patientNum) {
      const lastNum = parseInt(lastPatient.patientNum.replace(/\D/g, ''));
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const patientNum = `${prefix}${String(nextNum).padStart(3, '0')}`;
    console.log('3. Patient num:', patientNum);

    // Find first available cubicle for this service category
    const { data: cubicleData } = await supabase
      .from('cubicle')
      .select('*')
      .eq('category', serviceName)
      .order('id', { ascending: true });

    console.log('4. Cubicles:', cubicleData);

    // Get all patients currently assigned to cubicles in this category today
    const { data: assignedPatients } = await supabase
      .from('patients')
      .select('cubicleNum')
      .eq('service', serviceName)
      .eq('status', 'On Progress')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    const occupiedCubicles = new Set(assignedPatients?.map(p => p.cubicleNum) ?? []);

    // Pick first cubicle that has no patient assigned
    const { count: totalCount } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('service', serviceName)
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

    const cubicleIndex = (totalCount ?? 0) % (cubicleData?.length ?? 1);
    const availableCubicle = cubicleData?.[cubicleIndex];

    console.log('5. Available cubicle:', availableCubicle);

    const { data, error } = await supabase
      .from('patients')
      .insert({
        patientNum,
        service: serviceName,
        status: availableCubicle ? 'On Progress' : 'Waiting',
        phoneNum: null,
        cubicleNum: availableCubicle ? availableCubicle.cubicleNum : null,
      })
      .select()
      .single();

    console.log('6. Insert:', data, error);

    if (!error && data) {
      console.log('7. Redirecting...');
      router.push(`/kiosk/queue-print?serviceId=${serviceId}&patientNum=${patientNum}`);
    }
  } catch (err) {
    console.log('CAUGHT ERROR:', err);
  }
};

  return (
    <div className="flex flex-col justify-center">
      <button
        onClick={handleContinue}
        className="mx-8 my-3 max-w-full py-[18px] px-[18px] bg-red-600 text-white text-center text-[60px] font-baloo font-black rounded-[45px] transition-all active:scale-90 shadow-xl"
      >
        Magpatuloy - Continue
      </button>
      <button
        onClick={() => router.push('/kiosk/kiosk-services')}
        className="mx-8 my-3 max-w-full py-[18px] px-[18px] border-gray-600 text-center rounded-[45px] bg-gray-500 text-gray-800 text-[50px] transition-all active:scale-90"
      >
        Bumalik - Cancel
      </button>
    </div>
  );
}