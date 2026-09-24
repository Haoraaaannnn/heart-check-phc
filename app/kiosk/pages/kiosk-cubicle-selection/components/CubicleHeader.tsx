"use client";

import { cubicleSelectionTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelectionTexts";
import { cubicleSelectionTypography } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelection";

/**
 * Top header banner on the cubicle selection screen.
 *
 * @remarks
 * Greets the patient and instructs them to choose the cubicle matching their appointment or preference.
 *
 * @returns The instruction header block.
 */
export default function CubicleHeader() {
    return (
        <div className="w-full px-6 pb-6 md:pb-10 text-center">
            <h1
                className="font-black leading-tight text-black"
                style={{ fontSize: cubicleSelectionTypography.titleSize }}
            >
                {cubicleSelectionTexts.headerTitle}
            </h1>

            <p
                className="mt-3 md:mt-4 font-normal leading-tight text-gray-800"
                style={{ fontSize: cubicleSelectionTypography.subtitleSize }}
            >
                {cubicleSelectionTexts.headerSubtitle}
            </p>
        </div>
    );
}