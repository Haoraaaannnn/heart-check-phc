"use client";

import { CubicleSelectorType } from "@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import {
    CubicleCardStyle,
    CubicleCardClasses,
    CubicleCardIcons,
} from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard";
import { CubicleCardTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCardTexts";

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
 * Displays the cubicle designation along with the active physician assigned to that station
 * (with automatic `Dr.` prefixing and full text-wrapping compliance).
 *
 * @param props - Component props.
 * @returns An interactive cubicle selection button with physician designation.
 */
export default function CubicleCard({
    cubicle,
    serviceId,
    patientType,
    subcategory,
}: CubicleCardProps) {
    const navigate = useKioskNavigate();

    // Filter linked cubicles matching category and chosen subcategory
    const matchingCubicles = (cubicle.cubicles ?? [])
        .map((link) => link.cubicle)
        .filter(
            (actualCubicle) =>
                actualCubicle &&
                actualCubicle.category === "Consultation" &&
                (!subcategory || actualCubicle.subcategory === subcategory)
        );

    // Extract doctor name from matching cubicles, falling back to top-level selector doctor
    const matchingDoctorNames = Array.from(
        new Set(matchingCubicles.map((c) => c?.doctorName).filter(Boolean))
    ) as string[];

    const rawDoctorName =
        matchingDoctorNames.length > 0
            ? matchingDoctorNames.join(", ")
            : cubicle.doctorName || null;

    // Format doctor name with "Dr." prefix if not already present
    const formattedDoctorName = rawDoctorName
        ? /^dr\.?\s+/i.test(rawDoctorName.trim())
            ? rawDoctorName.trim()
            : `${CubicleCardTexts.doctorPrefix} ${rawDoctorName.trim()}`
        : null;

    /**
     * Resolves matching cubicle numbers and pushes to the SMS input route.
     */
    const handleClick = () => {
        const params = new URLSearchParams();

        // Extract cubicle numbers matching category and chosen subcategory
        const cubicleNums = matchingCubicles.map((actualCubicle) => actualCubicle!.cubicleNum);

        if (cubicleNums.length === 0) return;

        if (serviceId) params.set("serviceId", serviceId);
        if (patientType) params.set("type", patientType);
        if (subcategory) params.set("subcategory", subcategory);
        params.set("preferredCubicleNums", cubicleNums.join(","));

        // Forward patient-selected cubicle identifier for ticket print display
        const selectedCubicle = cubicle.cubicle_name || cubicleNums[0];
        if (selectedCubicle) {
            params.set("cubicleNum", selectedCubicle);
        }

        navigate(`/kiosk/pages/sms-input?${params.toString()}`);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            style={CubicleCardStyle.card}
            className={CubicleCardClasses.card}
        >
            {/* Brand-colored icon container */}
            <div
                style={CubicleCardStyle.iconWrapper}
                className={CubicleCardClasses.cardIconWrapper}
            >
                <i
                    className={`bx ${CubicleCardIcons.cubicle}`}
                    style={CubicleCardStyle.icon}
                    aria-hidden="true"
                />
            </div>

            {/* Labels. min-w-0 lets the text wrap instead of pushing the arrow out. */}
            <div style={CubicleCardStyle.labelWrapper}>
                <span style={CubicleCardStyle.title}>
                    {cubicle.cubicle_name}
                </span>
                <div style={CubicleCardStyle.divider} />
                <span style={CubicleCardStyle.subtitle}>
                    {formattedDoctorName || CubicleCardTexts.unassignedDoctor}
                </span>
            </div>

            {/* Directional arrow */}
            <i
                className={`bx ${CubicleCardIcons.arrow} ${CubicleCardClasses.cardArrow}`}
                style={CubicleCardStyle.arrowIcon}
                aria-hidden="true"
            />
        </button>
    );
}