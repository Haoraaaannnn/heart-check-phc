"use client";

import { useEffect } from "react";
import * as TablerIcons from "@tabler/icons-react";
import type { Service } from "@/types/Services";
import ConfirmationDescriptions from "@/app/kiosk/pages/confirmation/components/ConfimationDescription";
import ConfirmationActions from "@/app/kiosk/pages/confirmation/components/ConfirmationActions";
import { themeColors } from "@/constants/colors";

/** Tabler icons mapping for runtime lookup. */
const ICONS = TablerIcons as unknown as Record<string, TablerIcons.Icon | undefined>;

/** Props for {@link ConfirmationModal}. */
interface ConfirmationModalProps {
    /** The service chosen by the patient, or null if unselected. */
    service: Service | null;
    /** Current patient type discriminator ("new" | "old"). */
    patientType?: "new" | "old";
    /** Whether the modal is currently displayed. */
    isOpen: boolean;
    /** Callback to close the modal. */
    onClose: () => void;
}

/**
 * Modal dialog displaying service details and asking for patient confirmation.
 *
 * @remarks
 * Renders on top of the services grid when a card is selected. Locks the body
 * scroll while open and handles backdrop dismissal.
 *
 * @param props - Component props.
 * @returns The confirmation modal overlay, or null when closed.
 */
export default function ConfirmationModal({
    service,
    patientType,
    isOpen,
    onClose,
}: ConfirmationModalProps) {
    // Prevent background scrolling while modal is active
    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    if (!isOpen || !service) return null;

    const Icon = ICONS[service.icon_src] ?? TablerIcons.IconCircleDashed;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col w-full max-w-[900px] max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    className="relative flex items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 rounded-t-3xl text-white shrink-0"
                    style={{ backgroundColor: themeColors.brandRed }}
                >
                    <Icon
                        className="size-12 sm:size-14 shrink-0"
                        size={56}
                        stroke={1.5}
                        color="#ffffff"
                    />
                    <div className="flex flex-col min-w-0">
                        <span
                            id="confirmation-modal-title"
                            className="font-black text-xl sm:text-2xl leading-tight truncate"
                        >
                            {service.label_fil}
                        </span>
                        <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-xs sm:text-sm font-bold px-3 py-0.5 rounded-full mt-1">
                            {service.label_en}
                        </span>
                    </div>
                </div>

                {/* Description Body */}
                <div className="px-6 sm:px-8 py-5 sm:py-6">
                    <ConfirmationDescriptions service={service} />
                </div>

                {/* Actions Footer */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                    <ConfirmationActions
                        service={service}
                        patientType={patientType}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}