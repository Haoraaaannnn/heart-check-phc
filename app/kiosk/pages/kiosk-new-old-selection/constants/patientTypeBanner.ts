/**
 * @file patientTypeBanner.ts
 * @description Centralized visual styles for `PatientTypeBanner`.
 */

import { CSSProperties } from "react";
import {
    sharedKioskBannerStyle,
    sharedKioskBannerTypography,
} from "@/constants/kiosk";

/** Typography tokens for patient type banner, referencing centralized shared banner scale. */
export const patientTypeBannerTypography = {
    bannerTitleSize: sharedKioskBannerTypography.titleSize,
    bannerSubtitleSize: sharedKioskBannerTypography.subtitleSize,
} as const;

/** Inline styles for `PatientTypeBanner`, referencing centralized shared banner style. */
export const PatientTypeBannerStyle = sharedKioskBannerStyle satisfies Record<string, CSSProperties>;

