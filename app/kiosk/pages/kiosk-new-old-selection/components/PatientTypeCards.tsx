"use client";

import * as TablerIcons from "@tabler/icons-react";
import { PatientCategory } from "@/app/kiosk/pages/kiosk-new-old-selection/types/PatientType";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import {
    PatientTypeCardStyle,
    kioskNewOldColors,
} from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOld";

/**
 * Tabler icons index for dynamic resolution via `patientCategory.icon_src`.
 */
const ICONS = TablerIcons as unknown as Record<string, TablerIcons.Icon | undefined>;

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
 *
 * @param props - Component props.
 * @returns An interactive card with icon, Filipino title, English pill, and directional arrow.
 */
export default function PatientTypeCard({ patientCategory }: PatientTypeCardProps) {
    const navigate = useKioskNavigate();
    const pc = patientCategory;
    const Icon = ICONS[pc.icon_src] ?? TablerIcons.IconCircleDashed;

    const handleSelect = () => {
        navigate(`/kiosk/pages/kiosk-services?type=${pc.type}`);
    };

    return (
        <button
            type="button"
            onClick={handleSelect}
            style={PatientTypeCardStyle.card}
            className="group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-md"
        >
            {/* Brand-colored icon container */}
            <div
                style={PatientTypeCardStyle.iconWrapper}
                className="transition-transform group-hover:scale-105"
            >
                <Icon size={56} stroke={1.5} color={kioskNewOldColors.white} className="sm:size-16" />
            </div>

            {/* Category Labels */}
            <div style={PatientTypeCardStyle.labelsWrapper}>
                <span style={PatientTypeCardStyle.cardTitle}>
                    {pc.label_fil}
                </span>

                <span style={PatientTypeCardStyle.cardBadge}>
                    {pc.label_en}
                </span>
            </div>

            {/* Directional navigation indicator */}
            <TablerIcons.IconArrowNarrowRight
                size={36}
                stroke={2}
                color={kioskNewOldColors.arrowColor}
                className="shrink-0 transition-transform group-hover:translate-x-1"
            />
        </button>
    );
}