'use client';
import { useRouter } from 'next/navigation';
import { getTimestamp } from '@/lib/logger';
import { Service } from '@/types/Services';

export default function ConfirmationActions({
  service,
  patientType,
}: {
  service: Service;
  patientType?: "new" | "old";
}) {
  const router = useRouter();

  const handleContinue = () => {
    const isConsultation = service.label_en?.toLowerCase() === "consultation";

    if (isConsultation) {
      console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] Consultation service - Redirecting to cubicle selection - ServiceId: ${service.id}`);
      router.push(`/kiosk/kiosk-cubicle-selection?serviceId=${service.id}${patientType ? `&type=${patientType}` : ""}`);
      return;
    }

    console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] Service confirmed - Redirecting to SMS input - ServiceId: ${service.id}`);
    router.push(`/kiosk/sms-input?serviceId=${service.id}`);
  };

  const handleCancel = () => {
    router.push(patientType ? `/kiosk/kiosk-services?type=${patientType}` : '/kiosk/kiosk-services');
  };

  return (
    <div className="flex flex-col justify-center px-8 w-full mt-4 mb-6 gap-4">
      <button
        onClick={handleContinue}
        className="w-full py-[15px] text-white text-center text-[40px] font-black rounded-[16px] transition-all active:scale-95 shadow-md bg-[#7f0407]">
        Magpatuloy - Continue
      </button>
      <button
        onClick={handleCancel}
        className="w-full py-[15px] border-gray-400 border-[0.3vh] text-center rounded-[16px] font-black text-gray-500 text-[40px] transition-all active:scale-95 bg-white">
        Bumalik - Cancel
      </button>
    </div>
  );
}