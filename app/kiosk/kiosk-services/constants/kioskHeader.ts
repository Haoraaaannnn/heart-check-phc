import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Spacing values in px for the kiosk header bar. */
export const kioskHeaderSpacing = {
  paddingX: 16,
  paddingY: 16,
  brandGap: 12,
} as const;

/** Header font sizes in px. */
export const kioskHeaderFontSize = {
  brand: 34,
  time: 34,
  date: 28,
} as const;

/** Numeric font weights (`black` matches Tailwind's `font-black`). */
export const kioskHeaderFontWeight = {
  normal: 400,
  black: 900,
} as const;

/**
 * Line-height for the clock time.
 * Preserves the line-height that Tailwind's `text-2xl` was applying
 * implicitly (2rem on Tailwind v3), so the bar height stays the same.
 */
export const kioskHeaderTimeLineHeight = "2rem";

/** Header text colors as literal hex values. */
export const kioskHeaderTextColor = {
  white: "#ffffff",
} as const;

/**
 * Inline styles for the kiosk header bar, composed from the tokens above.
 * Background (`bg-brand`) and the accent color (`text-brand-light`) are still
 * applied through `className` because they come from the Tailwind theme.
 */
export const KioskHeaderStyle = {
  /** Outer bar: full-width flex row, brand on the left, clock on the right. */
  container: {
    backgroundColor: themeColors.brandRed,
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: kioskHeaderSpacing.paddingX,
    paddingBlock: kioskHeaderSpacing.paddingY,
  },
  /** Wrapper for the two brand-name spans. */
  brand: {
    display: "flex",
    alignItems: "center",
    gap: kioskHeaderSpacing.brandGap,
  },
  /** "Heart Check" (white). */
  brandPrimary: {
    color: kioskHeaderTextColor.white,
    fontSize: kioskHeaderFontSize.brand,
    fontWeight: kioskHeaderFontWeight.black,
  },
  /** "PHC" (color comes from the `text-brand-light` class). */
  brandAccent: {
    fontSize: kioskHeaderFontSize.brand,
    fontWeight: kioskHeaderFontWeight.black,
  },
  /** Right-hand block holding the time and date. */
  clock: {
    textAlign: "right",
  },
  /** Current time. */
  time: {
    color: kioskHeaderTextColor.white,
    fontSize: kioskHeaderFontSize.time,
    lineHeight: kioskHeaderTimeLineHeight,
  },
  /** Current date. */
  date: {
    color: kioskHeaderTextColor.white,
    fontSize: kioskHeaderFontSize.date,
    fontWeight: kioskHeaderFontWeight.black,
  },
} satisfies Record<string, CSSProperties>;