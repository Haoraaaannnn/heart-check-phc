"use client";

import { cubicleSelectionTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelectionTexts";
import { CubicleHeaderStyle } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelection";

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
        <div style={CubicleHeaderStyle.container}>
            <h1 style={CubicleHeaderStyle.title}>
                {cubicleSelectionTexts.headerTitle}
            </h1>

            <p style={CubicleHeaderStyle.subtitle}>
                {cubicleSelectionTexts.headerSubtitle}
            </p>
        </div>
    );
}