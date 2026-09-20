"use client";

import { KioskBannerServiceTexts } from "@/constants/kioskTexts";
import { KioskBannerStyle } from "@/app/kiosk/kiosk-services/constants/kioskBanner";

export default function KioskBanner() {
    return (
        <div style={KioskBannerStyle.container}>
            <p style={KioskBannerStyle.Title}>
                {KioskBannerServiceTexts.bannerTitle}
            </p>
            <p style={KioskBannerStyle.subtitle}>
                {KioskBannerServiceTexts.bannerSubtitle}
            </p>
        </div>
    );
}