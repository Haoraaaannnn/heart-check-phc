"use client";

import { PatientCategory } from "@/app/kiosk/pages/kiosk-new-old-selection/types/PatientType";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import {
    PatientTypeCardStyle,
    PatientTypeCardsClasses,
    PatientTypeCardIcons,
} from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeCards";
import { resolvePatientTypeIcon } from "@/constants/icons";

/** Props for {@link PatientTypeCard}. */
interface PatientTypeCardProps {
    /** The patient category record from `patient_category` table. */
    patientCategory: PatientCategory;
}

/**
 * Tappable card button representing a patient category (e.g. New or Old Patient).
 *
 * @remarks
 * On tap, immediately triggers the kiosk loading overlay and navigates
 * to `/kiosk/pages/kiosk-services?type=<type>` via {@link useKioskNavigate}.
 * Designed for maximum accessibility, high contrast, and zero text wrapping.
 *
 * @param props - Component props.
 * @returns An interactive card with icon, Filipino title, English subtitle, helper pill, and directional chevron.
 */
export default function PatientTypeCard({ patientCategory }: PatientTypeCardProps) {
    const navigate = useKioskNavigate();
    const pc = patientCategory;
    const iconClass = resolvePatientTypeIcon(pc);

    const handleSelect = () => {
        navigate(`/kiosk/pages/kiosk-services?type=${pc.type}`);
    };

    return (
        <button
            type="button"
            onClick={handleSelect}
            style={PatientTypeCardStyle.card}
            className={PatientTypeCardsClasses.card}
            aria-label={`${pc.label_fil} - ${pc.label_en}`}
        >
            {/* Category Icon Container (No background) */}
            <div
                style={PatientTypeCardStyle.iconWrapper}
                className={PatientTypeCardsClasses.cardIconWrapper}
            >
                <i
                    className={`bx ${iconClass} ${PatientTypeCardsClasses.cardIcon}`}
                    style={PatientTypeCardStyle.cardIcon}
                    aria-hidden="true"
                />
            </div>

            {/* Category Labels */}
            <div style={PatientTypeCardStyle.labelsWrapper}>
                <span style={PatientTypeCardStyle.cardTitle}>
                    {pc.label_fil}
                </span>

                <div style={PatientTypeCardStyle.divider} />

                <span style={PatientTypeCardStyle.cardSubtitle}>
                    {pc.label_en}
                </span>
            </div>

            {/* Directional Navigation Indicator (No background wrapper) */}
            <i
                className={`bx ${PatientTypeCardIcons.arrow} ${PatientTypeCardsClasses.cardArrow}`}
                style={PatientTypeCardStyle.arrowIcon}
                aria-hidden="true"
            />
        </button>
    );
}