/**
 * @file categoryHeader.ts
 * @description Centralized visual styles for the category selection header.
 */

import { CSSProperties } from "react";
import {
    sharedKioskBannerStyle,
    sharedKioskBannerTypography,
} from "@/constants/kiosk";

/** Typography tokens for the category selection header, referencing centralized shared banner scale. */
export const categoryHeaderTypography = {
    titleSize: sharedKioskBannerTypography.titleSize,
    subtitleSize: sharedKioskBannerTypography.subtitleSize,
    titleWeight: sharedKioskBannerTypography.titleWeight,
    subtitleWeight: sharedKioskBannerTypography.subtitleWeight,
} as const;

/** Inline styles for `CategorySelectionPage` header, bound to centralized shared banner style. */
export const CategoryHeaderStyle = sharedKioskBannerStyle;

