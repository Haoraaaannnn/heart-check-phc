'use client';
import { useRouter } from 'next/navigation';
import { getTimestamp } from '@/lib/logger';
import { Service } from '@/types/Services';

interface Props {
  service: Service;
  patientType?: "new" | "old";
  onCancel?: () => void;
  onContinue?: () => void;
}

export default function ConfirmationActions({
  service,
  patientType,
  onCancel,
  onContinue,
}: Props) {
  const router = useRouter();

  const handleContinue = () => {
    onContinue?.();

    const label = service.label_en?.trim().toLowerCase();
    const isConsultation = label === "consultation";
    const isOPDScreening = label === "opd screening";

    // 'new' / 'old' services imply their own patient type; 'both' and
    // anything unrecognised (NULL, unexpected value) stays undefined.
    const serviceType =
      service.patient_type === "new" || service.patient_type === "old"
        ? service.patient_type
        : undefined;

    // Prefer what the patient actually picked; fall back to what the
    // service implies. Stays undefined for 'both' services with no pick.
    const resolvedType = patientType ?? serviceType;

    // Single place that builds the URL so every branch threads the same
    // params (the fallback used to drop `type`).
    const buildUrl = (path: string) => {
      const params = new URLSearchParams({ serviceId: String(service.id) });
      if (resolvedType) params.set("type", resolvedType);
      return `${path}?${params.toString()}`;
    };

    if (isConsultation) {
      console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] Consultation service - Redirecting to cubicle selection - ServiceId: ${service.id}`);
      router.push(buildUrl("/kiosk/consultation-category"));
      return;
    }

    if (isOPDScreening) {
      console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] OPD Screening service - Redirecting to category selection - ServiceId: ${service.id}`);
      router.push(buildUrl("/kiosk/opd-screening-category"));
      return;
    }

    // 'both' services (OPD Card, Refill, ECG, Warfarin, Reschedule,
    // Benzathine): no category step, no registration stage.
    console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] 'both' service confirmed - Redirecting to SMS input - ServiceId: ${service.id}${resolvedType ? ` - type: ${resolvedType}` : ""}`);
    router.push(buildUrl("/kiosk/sms-input"));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.push(patientType ? `/kiosk/kiosk-services?type=${patientType}` : '/kiosk/kiosk-services');
  };

  return (
    <div className="flex flex-col justify-center w-full mt-2 gap-3">
      <button
        onClick={handleContinue}
        className="w-full py-[15px] text-white text-center text-2xl font-black rounded-[16px] transition-all active:scale-95 shadow-md bg-[#7f0407]">
        Magpatuloy - Continue
      </button>
      <button
        onClick={handleCancel}
        className="w-full py-[15px] border-gray-400 border-[0.3vh] text-center rounded-[16px] font-black text-gray-500 text-2xl transition-all active:scale-95 bg-white">
        Bumalik - Cancel
      </button>
    </div>
  );
}