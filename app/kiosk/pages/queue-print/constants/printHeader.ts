/**
 * @file printHeader.ts
 * @description Centralized visual styles for `PrintHeader` on `/kiosk/pages/queue-print`.
 *
 * Sized with responsive fluid viewport-height (`vh`) clamps to ensure the header
 * remains prominent and legible while preserving maximum vertical space for the
 * queue ticket card in both landscape and portrait orientations.
 *
 * @module app/kiosk/pages/queue-print/constants/printHeader
 */

import { CSSProperties } from "react";

import {
    sharedKioskBannerStyle,
    sharedKioskBannerTypography,
} from "@/constants/kiosk";

/** Typography tokens for print header, referencing centralized shared banner scale. */
export const PrintHeaderTypography = {
    titleSize: sharedKioskBannerTypography.titleSize,
    subtitleSize: sharedKioskBannerTypography.subtitleSize,
    titleWeight: sharedKioskBannerTypography.titleWeight,
    subtitleWeight: sharedKioskBannerTypography.subtitleWeight,
} as const;

/** Inline styles for `PrintHeader`, bound to centralized shared banner style. */
export const PrintHeaderStyle = {
    container: sharedKioskBannerStyle.container,
    title: sharedKioskBannerStyle.title,
    subtitle: sharedKioskBannerStyle.subtitle,
} satisfies Record<string, CSSProperties>;


