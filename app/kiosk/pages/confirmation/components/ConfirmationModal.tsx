"use client";

import { useEffect } from "react";
import * as TablerIcons from "@tabler/icons-react";
import type { Service } from "@/types/Services";
import ConfirmationDescriptions from "@/app/kiosk/pages/confirmation/components/ConfimationDescription";
import ConfirmationActions from "@/app/kiosk/pages/confirmation/components/ConfirmationActions";
import { ConfirmationModalStyle } from "@/app/kiosk/pages/confirmation/constants/confirmation";

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
            style={ConfirmationModalStyle.overlay}
            className="animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                style={ConfirmationModalStyle.modalBox}
                className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div style={ConfirmationModalStyle.modalHeader}>
                    <Icon
                        className="size-12 sm:size-14 shrink-0"
                        size={56}
                        stroke={1.5}
                        color="#ffffff"
                    />
                    <div className="flex flex-col min-w-0">
                        <span
                            id="confirmation-modal-title"
                            style={ConfirmationModalStyle.modalTitle}
                        >
                            {service.label_fil}
                        </span>
                        <span style={ConfirmationModalStyle.modalBadge}>
                            {service.label_en}
                        </span>
                    </div>
                </div>

                {/* Description Body */}
                <div style={ConfirmationModalStyle.modalBody}>
                    <ConfirmationDescriptions service={service} />
                </div>

                {/* Actions Footer */}
                <div style={ConfirmationModalStyle.modalFooter}>
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