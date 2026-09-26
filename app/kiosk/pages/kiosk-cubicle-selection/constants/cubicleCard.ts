/**
 * @file cubicleCard.ts
 * @description Centralized visual styles and Tailwind utility classes for `CubicleCard`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Spacing values for cubicle card. */
export const cubicleCardSpacing = {
    cardGap: 16,
    cardPaddingX: "clamp(18px, 2.5vw, 28px)",
    cardPaddingY: 16,
    iconTilePadding: "clamp(10px, 1.2vw, 16px)",
} as const;

/** Typography tokens for cubicle card. */
export const cubicleCardTypography = {
    cardTitleSize: "clamp(20px, 2vw, 28px)",
} as const;

/** Color tokens for cubicle card. */
export const cubicleCardColors = {
    cardTitleText: "#111827",
    iconTileBg: themeColors.brandRed,
    iconFill: themeColors.white,
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB",
    arrowColor: "#D7D6D6",
} as const;

/** Inline styles for `CubicleCard`. */
export const CubicleCardStyle = {
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: cubicleCardSpacing.cardGap,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: cubicleCardColors.cardBorder,
        backgroundColor: cubicleCardColors.cardBg,
        paddingLeft: cubicleCardSpacing.cardPaddingX,
        paddingRight: cubicleCardSpacing.cardPaddingX,
        paddingTop: cubicleCardSpacing.cardPaddingY,
        paddingBottom: cubicleCardSpacing.cardPaddingY,
        textAlign: "left",
        overflow: "hidden",
        cursor: "pointer",
    },
    iconWrapper: {
        flexShrink: 0,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: cubicleCardSpacing.iconTilePadding,
        backgroundColor: cubicleCardColors.iconTileBg,
    },
    titleWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        paddingLeft: 8,
    },
    title: {
        fontWeight: 900,
        fontSize: cubicleCardTypography.cardTitleSize,
        lineHeight: 1.2,
        color: cubicleCardColors.cardTitleText,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `CubicleCard`. */
export const CubicleCardClasses = {
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 landscape:grid-cols-3 gap-6 px-6 py-6",
    card: "group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-md",
    cardIconWrapper: "transition-transform group-hover:scale-105",
    cardArrow: "shrink-0 transition-transform group-hover:translate-x-1",
} as const;
