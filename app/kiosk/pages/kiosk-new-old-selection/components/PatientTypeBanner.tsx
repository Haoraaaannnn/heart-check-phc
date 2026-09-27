"use client";

import { PatientTypeBannerTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBannerTexts";
import { PatientTypeBannerStyle } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBanner";

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
        <div style={PatientTypeBannerStyle.container}>
            <h1 style={PatientTypeBannerStyle.title}>
                {PatientTypeBannerTexts.bannerTitle}
            </h1>

            <p style={PatientTypeBannerStyle.subtitle}>
                {PatientTypeBannerTexts.bannerSubtitle}
            </p>
        </div>
    );
}