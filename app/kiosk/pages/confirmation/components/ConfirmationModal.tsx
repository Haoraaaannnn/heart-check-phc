"use client";

import { useEffect } from "react";
import type { Service } from "@/types/Services";
import ConfirmationDescriptions from "@/app/kiosk/pages/confirmation/components/ConfimationDescription";
import ConfirmationActions from "@/app/kiosk/pages/confirmation/components/ConfirmationActions";
import {
    ConfirmationModalStyle,
    ConfirmationModalClasses,
} from "@/app/kiosk/pages/confirmation/constants/confirmationModal";
import { resolveServiceIcon } from "@/constants/icons";

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

    const iconClass = resolveServiceIcon(service);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            style={ConfirmationModalStyle.overlay}
            className={ConfirmationModalClasses.overlay}
            onClick={onClose}
        >
            <div
                style={ConfirmationModalStyle.modalBox}
                className={ConfirmationModalClasses.scroll}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div style={ConfirmationModalStyle.modalHeader}>
                    <i
                        className={`bx ${iconClass} ${ConfirmationModalClasses.icon}`}
                        style={ConfirmationModalStyle.icon}
                        aria-hidden="true"
                    />
                    <div className={ConfirmationModalClasses.headerText}>
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