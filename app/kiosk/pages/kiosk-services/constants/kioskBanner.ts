import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography, fontSizeHeader } from "@/constants/kiosk";

/** Spacing values in px for the kiosk banner. */
export const kioskBannerSpacing = {
  bannerPaddingX: 0,
  bannerBottom: 0,
  bannerSubtitleMarginGap: 8,
} as const;

/** Typography tokens for kiosk banner, referencing centralized root typography scale. */
export const kioskBannerTypography = {
  titleSize: kioskTypography.pageTitle,
  subtitleSize: kioskTypography.pageSubtitle,
  titleWeight: 900,
  subtitleWeight: 500,
} as const;

/** Banner font sizes, preserving backwards compatibility. */
export const kioskBannerFontSize = {
  Text1: fontSizeHeader.Header1,
  Text2: fontSizeHeader.Header2,
} as const;

/** Unitless line-heights (`tight` matches Tailwind's `leading-tight`). */
export const kioskBannerLineHeight = {
  tight: 1.2,
  relaxed: 1.25,
} as const;

/** Numeric font weights (`bold` here is the heaviest, matching Tailwind's `font-black`). */
export const kioskBannerFontWeight = {
  normal: 400,
  medium: 500,
  bold: 900,
} as const;

/** Banner text colors — references the centralized palette. */
export const kioskBannerTextColor = {
  black: themeColors.black,
  subtitle: "#4B5563",
} as const;

/**
 * Inline styles for `KioskBanner`, aligned with the CategoryHeaderStyle pattern.
 * Provides clean zero-padding banner layout that sits tight against the services grid.
 */
export const KioskBannerStyle = {
  container: {
    width: "100%",
    textAlign: "center",
  },
  Title: {
    fontSize: kioskBannerTypography.titleSize,
    fontWeight: kioskBannerTypography.titleWeight,
    lineHeight: kioskBannerLineHeight.tight,
    color: kioskBannerTextColor.black,
    margin: 0,
  },
  subtitle: {
    margin: 0,
    marginTop: kioskBannerSpacing.bannerSubtitleMarginGap,
    fontSize: kioskBannerTypography.subtitleSize,
    fontWeight: kioskBannerTypography.subtitleWeight,
    lineHeight: kioskBannerLineHeight.relaxed,
    color: kioskBannerTextColor.subtitle,
  },
} satisfies Record<string, CSSProperties>;