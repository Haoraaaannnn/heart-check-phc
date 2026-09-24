"use client";

import * as TablerIcons from "@tabler/icons-react";
import { PatientCategory } from "@/app/kiosk/pages/kiosk-new-old-selection/types/PatientType";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { kioskNewOldTypography } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOld";
import { themeColors } from "@/constants/colors";

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
            className="group relative flex h-[160px] md:h-[180px] lg:h-[200px] w-full items-center gap-3 sm:gap-4 rounded-2xl border-2 border-gray-300 bg-white px-5 sm:px-8 py-5 transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-md text-left overflow-hidden"
        >
            {/* Brand-colored icon container */}
            <div
                className="size-18 sm:size-20 md:size-22 shrink-0 rounded-2xl flex items-center justify-center p-3 sm:p-4 transition-transform group-hover:scale-105"
                style={{ backgroundColor: themeColors.brandRed }}
            >
                <Icon size={56} stroke={1.5} color="#ffffff" className="sm:size-16" />
            </div>

            {/* Category Labels */}
            <div className="relative z-10 flex flex-1 flex-col min-w-0 pl-1 sm:pl-2 text-black">
                <span
                    className="font-black truncate leading-tight text-gray-900"
                    style={{ fontSize: kioskNewOldTypography.cardTitleSize }}
                >
                    {pc.label_fil}
                </span>

                <span
                    className="mt-1 w-fit inline-block bg-red-100/70 border border-red-300/60 text-red-950 font-bold px-3 py-1 rounded-full leading-none"
                    style={{ fontSize: kioskNewOldTypography.cardBadgeSize }}
                >
                    {pc.label_en}
                </span>
            </div>

            {/* Directional navigation indicator */}
            <TablerIcons.IconArrowNarrowRight
                size={36}
                stroke={2}
                color="#D7D6D6"
                className="shrink-0 transition-transform group-hover:translate-x-1"
            />
        </button>
    );
}