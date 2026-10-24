import { CSSProperties } from "react";
import {
  sharedKioskBannerStyle,
  sharedKioskBannerTypography,
} from "@/constants/kiosk";

/** Spacing values in px for the kiosk banner. */
export const kioskBannerSpacing = {
  bannerPaddingX: 0,
  bannerBottom: 0,
  bannerSubtitleMarginGap: 6,
} as const;

/** Typography tokens for kiosk banner, referencing centralized shared banner scale. */
export const kioskBannerTypography = {
  titleSize: sharedKioskBannerTypography.titleSize,
  subtitleSize: sharedKioskBannerTypography.subtitleSize,
  titleWeight: sharedKioskBannerTypography.titleWeight,
  subtitleWeight: sharedKioskBannerTypography.subtitleWeight,
} as const;

/**
 * Inline styles for `KioskBanner`, bound to centralized shared banner style.
 */
export const KioskBannerStyle = sharedKioskBannerStyle;