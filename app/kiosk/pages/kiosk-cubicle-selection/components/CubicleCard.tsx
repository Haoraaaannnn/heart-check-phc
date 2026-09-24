"use client";

import { IconStethoscope, IconArrowNarrowRight } from "@tabler/icons-react";
import { CubicleSelectorType } from "@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import {
    CubicleCardStyle,
    cubicleSelectionColors,
} from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelection";

/** Props for {@link CubicleCard}. */
interface CubicleCardProps {
    /** The cubicle selector group record. */
    cubicle: CubicleSelectorType;
    /** Current service ID passed down from previous steps. */
    serviceId?: string;
    /** Current patient type ("new" or "old") from the query params. */
    patientType?: string;
    /** Subcategory ("Adult" or "Pedia") chosen in the category step. */
    subcategory?: string;
}

/**
 * Tappable card button representing a cubicle choice for Consultation.
 *
 * @remarks
 * Filters linked cubicles to match `category === "Consultation"` and the selected
 * `subcategory`. When tapped, navigates to `/kiosk/pages/sms-input` with the preferred
 * cubicle numbers encoded in `preferredCubicleNums`.
 *
 * @param props - Component props.
 * @returns An interactive cubicle selection button.
 */
export default function CubicleCard({
    cubicle,
    serviceId,
    patientType,
    subcategory,
}: CubicleCardProps) {
    const navigate = useKioskNavigate();

    /**
     * Resolves matching cubicle numbers and pushes to the SMS input route.
     */
    const handleClick = () => {
        const params = new URLSearchParams();

        // Extract cubicle numbers matching category and chosen subcategory
        const cubicleNums = (cubicle.cubicles ?? [])
            .map((link) => link.cubicle)
            .filter(
                (actualCubicle) =>
                    actualCubicle &&
                    actualCubicle.category === "Consultation" &&
                    (!subcategory || actualCubicle.subcategory === subcategory)
            )
            .map((actualCubicle) => actualCubicle!.cubicleNum);

        if (cubicleNums.length === 0) return;

        if (serviceId) params.set("serviceId", serviceId);
        if (patientType) params.set("type", patientType);
        if (subcategory) params.set("subcategory", subcategory);
        params.set("preferredCubicleNums", cubicleNums.join(","));

        navigate(`/kiosk/pages/sms-input?${params.toString()}`);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            style={CubicleCardStyle.card}
            className="group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-md"
        >
            {/* Brand-colored icon container */}
            <div
                style={CubicleCardStyle.iconWrapper}
                className="transition-transform group-hover:scale-105"
            >
                <IconStethoscope size={48} stroke={1.5} color={cubicleSelectionColors.iconFill} />
            </div>

            {/* Cubicle Title */}
            <div style={CubicleCardStyle.titleWrapper}>
                <span style={CubicleCardStyle.title}>
                    {cubicle.cubicle_name}
                </span>
            </div>

            {/* Directional arrow */}
            <IconArrowNarrowRight
                size={36}
                stroke={2}
                color={cubicleSelectionColors.arrowColor}
                className="shrink-0 transition-transform group-hover:translate-x-1"
            />
        </button>
    );
}