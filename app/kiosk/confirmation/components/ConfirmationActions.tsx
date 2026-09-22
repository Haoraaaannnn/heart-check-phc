// app/kiosk/confirmation/components/ConfirmationActions.tsx
'use client';
import { useRouter } from 'next/navigation';
import { flushSync } from 'react-dom';
import { getTimestamp } from '@/lib/logger';
import { Service } from '@/types/Services';
import { useKioskLoading } from '@/app/kiosk/context/KioskLoadingContext';

interface Props {
  service: Service;
  patientType?: "new" | "old";
  onCancel?: () => void;
  onContinue?: () => void;
}

/**
 * Confirm / Cancel buttons for the service confirmation modal.
 *
 * @remarks
 * `flushSync` forces `showLoading()` to commit and paint before
 * `router.push()` starts its transition — otherwise React can batch the
 * two together and defer the overlay's appearance until the destination
 * route's data has already loaded, producing a blank-pause-then-blink
 * effect instead of an instant overlay. See `useKioskNavigate` for the
 * full explanation (this file predates that hook and duplicates its
 * navigate-with-loading logic inline).
 */
export default function ConfirmationActions({
  service,
  patientType,
  onCancel,
  onContinue,
}: Props) {
  const router = useRouter();
  const { showLoading } = useKioskLoading();

  /** Shows the overlay synchronously, then pushes to `href`. */
  const navigateWithLoading = (href: string) => {
    flushSync(() => {
      showLoading();
    });
    router.push(href);
  };

  const handleContinue = () => {
    onContinue?.();

    const label = service.label_en?.trim().toLowerCase();
    const isConsultation = label === "consultation";
    const isOPDScreening = label === "opd screening";

    const serviceType =
      service.patient_type === "new" || service.patient_type === "old"
        ? service.patient_type
        : undefined;

    const resolvedType = patientType ?? serviceType;

    const buildUrl = (path: string) => {
      const params = new URLSearchParams({ serviceId: String(service.id) });
      if (resolvedType) params.set("type", resolvedType);
      return `${path}?${params.toString()}`;
    };

    if (isConsultation) {
      console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] Consultation service - Redirecting to cubicle selection - ServiceId: ${service.id}`);
      navigateWithLoading(buildUrl("/kiosk/consultation-category"));
      return;
    }

    if (isOPDScreening) {
      console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] OPD Screening service - Redirecting to category selection - ServiceId: ${service.id}`);
      navigateWithLoading(buildUrl("/kiosk/opd-screening-category"));
      return;
    }

    console.log(`${getTimestamp()} [CONFIRMATION ACCEPTED] 'both' service confirmed - Redirecting to SMS input - ServiceId: ${service.id}${resolvedType ? ` - type: ${resolvedType}` : ""}`);
    navigateWithLoading(buildUrl("/kiosk/sms-input"));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    navigateWithLoading(patientType ? `/kiosk/kiosk-services?type=${patientType}` : '/kiosk/kiosk-services');
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