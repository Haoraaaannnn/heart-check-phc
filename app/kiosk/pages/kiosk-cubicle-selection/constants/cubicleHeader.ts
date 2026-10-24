/**
 * @file cubicleHeader.ts
 * @description Centralized visual styles for `CubicleHeader`.
 */

import { CSSProperties } from "react";
import {
    sharedKioskBannerStyle,
    sharedKioskBannerTypography,
} from "@/constants/kiosk";

/** Spacing values for cubicle header. */
export const cubicleHeaderSpacing = {
    headerPaddingX: 0,
    headerPaddingBottom: 0,
    headerSubtitleMarginTop: 6,
} as const;

/** Typography tokens for cubicle header, referencing centralized shared banner scale. */
export const cubicleHeaderTypography = {
    titleSize: sharedKioskBannerTypography.titleSize,
    subtitleSize: sharedKioskBannerTypography.subtitleSize,
    titleWeight: sharedKioskBannerTypography.titleWeight,
    subtitleWeight: sharedKioskBannerTypography.subtitleWeight,
} as const;

/** Inline styles for `CubicleHeader`, bound to centralized shared banner style. */
export const CubicleHeaderStyle = sharedKioskBannerStyle;

