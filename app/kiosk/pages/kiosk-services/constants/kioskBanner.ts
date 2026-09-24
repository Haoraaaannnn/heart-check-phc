import { CSSProperties } from "react";
import { fontSizeHeader } from "@/constants/kiosk";
import { themeColors } from "@/constants/colors";

/** Spacing values in px for the kiosk banner. */
export const kioskBannerSpacing = {
  bannerPaddingX: 40,
  bannerBottom: 40,
  bannerSubtitleMarginGap: 15,
} as const;

/** Banner font sizes, reusing the global header sizes. */
export const kioskBannerFontSize = {
  Text1: fontSizeHeader.Header1,
  Text2: fontSizeHeader.Header2,
} as const;

/** Unitless line-heights (`tight` matches Tailwind's `leading-tight`). */
export const kioskBannerLineHeight = {
  tight: 1.25,
} as const;

/** Numeric font weights (`bold` here is the heaviest, matching Tailwind's `font-black`). */
export const kioskBannerFontWeight = {
  normal: 400,
  bold: 900,
} as const;

/** Banner text colors — references the centralized palette. */
export const kioskBannerTextColor = {
  black: themeColors.black,
} as const;

/**
 * Inline styles for `KioskBanner`, composed from the tokens above.
 * Every value here must be valid CSS, since it is applied via the `style` prop.
 */
export const KioskBannerStyle = {
  container: {
    width: "100%",
    paddingLeft: kioskBannerSpacing.bannerPaddingX,
    paddingRight: kioskBannerSpacing.bannerPaddingX,
    paddingBottom: kioskBannerSpacing.bannerBottom,
    textAlign: "center",
  },
  Title: {
    fontSize: kioskBannerFontSize.Text1,
    fontWeight: kioskBannerFontWeight.bold,
    lineHeight: kioskBannerLineHeight.tight,
    color: kioskBannerTextColor.black,
  },
  subtitle: {
    marginTop: kioskBannerSpacing.bannerSubtitleMarginGap,
    fontSize: kioskBannerFontSize.Text2,
    fontWeight: kioskBannerFontWeight.normal,
    lineHeight: kioskBannerLineHeight.tight,
    color: kioskBannerTextColor.black,
  },
} satisfies Record<string, CSSProperties>;