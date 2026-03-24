'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  serviceId: number;
}

export default function ConfirmationActions({ serviceId }: Props) {
  const router = useRouter();

  const handleContinue = async () => {

      console.log('Continue clicked');
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { count } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    const nextNum = (count ?? 0) + 1;
    const patientNum = `C${String(nextNum).padStart(3, '0')}`; 

    const { data: serviceData } = await supabase
    .from('services')
    .select('label_en')
    .eq('id', serviceId)
    .single();

    const serviceName = serviceData?.label_en ?? String(serviceId);

    const { data, error } = await supabase
      .from('patients')
      .insert({
        patientNum,
        service: serviceName,
        status: 'Waiting',
        phoneNum: null,
        cubicleNum: null,
      })
      .select()
      .single();

    if (!error && data) {
    router.push(`/kiosk/queue-print?serviceId=${serviceId}&patientNum=${patientNum}`);
   } else {
    console.log('Failed to insert:', error);
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