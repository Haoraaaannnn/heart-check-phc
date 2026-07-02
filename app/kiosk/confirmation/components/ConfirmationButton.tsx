'use client';
import { useRouter } from 'next/navigation';
import { getTimestamp } from '@/lib/logger';

interface Props {
  serviceId: number;
  serviceColor: string;
}

export default function ConfirmationActions({ serviceId, serviceColor}: Props) {
  const router = useRouter();

  const handleContinue = () => {

    console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] Service confirmed - Redirecting to SMS input - ServiceId: ${serviceId}, ServiceColor: ${serviceColor}`);
    router.push(`/kiosk/sms-input?serviceId=${serviceId}`);
  };

  return (
    <div className="flex flex-col justify-center px-8 w-full mt-4 mb-6 gap-4">
      <button
        onClick={handleContinue}
        className="w-full py-[15px] text-white text-center text-[40px] font-black rounded-[16px] transition-all active:scale-95 shadow-md bg-[#7f0407]">
        Magpatuloy - Continue
      </button>
      <button
        onClick={() => router.push('/kiosk/kiosk-services')}
        className="w-full py-[15px] border-gray-400 border-[0.3vh] text-center rounded-[16px] font-black text-gray-500 text-[40px] transition-all active:scale-95 bg-white"
        style={{borderColor: serviceColor}}>
        Bumalik - Cancel
      </button>
    </div>
  );
}