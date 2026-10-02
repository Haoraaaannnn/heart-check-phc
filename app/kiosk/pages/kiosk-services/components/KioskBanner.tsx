"use client";

import { KioskBannerServiceTexts } from "@/app/kiosk/pages/kiosk-services/constants/kioskBannerTexts";
import { KioskBannerStyle } from "@/app/kiosk/pages/kiosk-services/constants/kioskBanner";

/**
 * Welcoming instruction header for the kiosk services menu.
 *
 * @remarks
 * Renders the bilingual Filipino/English greetings directly above the service cards grid,
 * matching the header pattern of `CategorySelectionPage` with semantic heading elements
 * and centralized typography.
 *
 * @returns The formatted title and subtitle banner.
 */
export default function KioskBanner() {
    return (
        <div style={KioskBannerStyle.container}>
            <h1 style={KioskBannerStyle.Title}>
                {KioskBannerServiceTexts.bannerTitle}
            </h1>
            <p style={KioskBannerStyle.subtitle}>
                {KioskBannerServiceTexts.bannerSubtitle}
            </p>
        </div>
    );
}