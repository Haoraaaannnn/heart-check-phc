"use client";

import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { getTimestamp } from "@/lib/logger";
import { Service } from "@/types/Services";
import { confirmationTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationTexts";
import { themeColors } from "@/constants/colors";

/** Props for {@link ConfirmationActions}. */
interface ConfirmationActionsProps {
    /** The service record being confirmed. */
    service: Service;
    /** Patient type passed from previous screens ("new" or "old"). */
    patientType?: "new" | "old";
    /** Optional callback executed when Cancel is clicked. */
    onCancel?: () => void;
    /** Optional callback executed when Continue is clicked. */
    onContinue?: () => void;
}

/**
 * Action buttons (Continue / Cancel) for confirming a service selection.
 *
 * @remarks
 * Uses {@link useKioskNavigate} to provide instant loading overlay transitions
 * during routing. Evaluates service characteristics to route to either:
 * 1. `/kiosk/pages/category-selection?serviceLabel=Consultation` for Consultation.
 * 2. `/kiosk/pages/category-selection?serviceLabel=OPD%20Screening` for OPD Screening.
 * 3. `/kiosk/pages/sms-input` directly for other services.
 *
 * @param props - Component props.
 * @returns The primary continue and secondary cancel buttons.
 */
export default function ConfirmationActions({
    service,
    patientType,
    onCancel,
    onContinue,
}: ConfirmationActionsProps) {
    const navigate = useKioskNavigate();

    /**
     * Determines the next route depending on the service selected.
     */
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

        const buildUrl = (path: string, serviceLabel?: string) => {
            const params = new URLSearchParams({ serviceId: String(service.id) });
            if (resolvedType) params.set("type", resolvedType);
            if (serviceLabel) params.set("serviceLabel", serviceLabel);
            return `${path}?${params.toString()}`;
        };

        if (isConsultation) {
            console.log(
                `${getTimestamp()} [CONFIRMATION ACCEPTED] Consultation service - Redirecting to category selection - ServiceId: ${service.id}`
            );
            navigate(buildUrl("/kiosk/pages/category-selection", "Consultation"));
            return;
        }

        if (isOPDScreening) {
            console.log(
                `${getTimestamp()} [CONFIRMATION ACCEPTED] OPD Screening service - Redirecting to category selection - ServiceId: ${service.id}`
            );
            navigate(buildUrl("/kiosk/pages/category-selection", "OPD Screening"));
            return;
        }

        console.log(
            `${getTimestamp()} [CONFIRMATION ACCEPTED] Service confirmed - Redirecting to SMS input - ServiceId: ${service.id}${
                resolvedType ? ` - type: ${resolvedType}` : ""
            }`
        );
        navigate(buildUrl("/kiosk/pages/sms-input"));
    };

    /**
     * Reverts to the previous service list or invokes the onCancel modal closer.
     */
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
            return;
        }
        navigate(
            patientType
                ? `/kiosk/pages/kiosk-services?type=${patientType}`
                : "/kiosk/pages/kiosk-services"
        );
    };

    return (
        <div className="flex flex-col justify-center w-full mt-2 gap-3 sm:gap-4">
            {/* Primary confirmation button */}
            <button
                type="button"
                onClick={handleContinue}
                className="w-full py-4 text-white text-center text-xl sm:text-2xl font-black rounded-2xl transition-all duration-150 active:scale-95 shadow-md hover:brightness-105"
                style={{ backgroundColor: themeColors.brandRed }}
            >
                {confirmationTexts.continueBtn}
            </button>

            {/* Secondary cancel/back button */}
            <button
                type="button"
                onClick={handleCancel}
                className="w-full py-3.5 border-2 border-gray-300 text-center rounded-2xl font-black text-gray-600 text-xl sm:text-2xl transition-all duration-150 active:scale-95 bg-white hover:bg-gray-50"
            >
                {confirmationTexts.cancelBtn}
            </button>
        </div>
    );
}