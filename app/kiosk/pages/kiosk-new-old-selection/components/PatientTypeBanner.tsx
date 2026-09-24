"use client";

import { kioskNewOldTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldTexts";
import { kioskNewOldTypography } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOld";

/**
 * Welcome greeting and instruction banner on the patient type selection screen.
 *
 * @remarks
 * Prompts the incoming patient to choose between new and old patient categories.
 *
 * @returns The localized welcome and instruction heading block.
 */
export default function PatientTypeBanner() {
    return (
        <div className="w-full px-6 pb-6 md:pb-10 text-center">
            <h1
                className="font-black leading-tight text-black"
                style={{ fontSize: kioskNewOldTypography.bannerTitleSize }}
            >
                {kioskNewOldTexts.bannerTitle}
            </h1>

            <p
                className="mt-3 md:mt-4 font-normal leading-tight text-gray-800"
                style={{ fontSize: kioskNewOldTypography.bannerSubtitleSize }}
            >
                {kioskNewOldTexts.bannerSubtitle}
            </p>
        </div>
    );
}