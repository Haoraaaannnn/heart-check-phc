/**
 * @file cubicleCard.ts
 * @description Centralized visual styles and Tailwind utility classes for `CubicleCard`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";
import { kioskTypography } from "@/constants/kiosk";

/** Boxicons class tokens for cubicle card elements. */
export const CubicleCardIcons = {
    cubicle: COMMON_ICONS.cubicle,
    arrow: COMMON_ICONS.arrowRight,
} as const;

/** Spacing values for cubicle card. */
export const cubicleCardSpacing = {
    cardGap: "clamp(12px, 1.6vmin, 18px)",
    cardPaddingX: "clamp(16px, 2.2vmin, 28px)",
    cardPaddingY: "clamp(16px, 1.8vh, 22px)",
    cardMinHeight: "clamp(100px, 11vh, 130px)",
} as const;

/** Typography tokens for cubicle card, referencing centralized root typography scale. */
export const cubicleCardTypography = {
    cardTitleSize: kioskTypography.cardCubicleTitle,
} as const;

/** Color tokens for cubicle card. */
export const cubicleCardColors = {
    cardTitleText: "#111827",
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB",
    arrowColor: "#D7D6D6",
} as const;

/** Inline styles for `CubicleCard`. */
export const CubicleCardStyle = {
    icon: {
        fontSize: "clamp(44px, 4.5vmin, 60px)",
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: "clamp(26px, 2.6vmin, 38px)",
        color: cubicleCardColors.arrowColor,
        lineHeight: 1,
    },
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        minHeight: cubicleCardSpacing.cardMinHeight,
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
        boxSizing: "border-box",
    },
    iconWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: "clamp(44px, 4.5vmin, 60px)",
    },
    titleWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        paddingLeft: "clamp(4px, 0.8vmin, 8px)",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
    title: {
        fontWeight: 900,
        fontSize: cubicleCardTypography.cardTitleSize,
        lineHeight: 1.2,
        color: cubicleCardColors.cardTitleText,
        whiteSpace: "normal",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `CubicleCard`. */
export const CubicleCardClasses = {
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 landscape:grid-cols-3 gap-3 sm:gap-6 px-4 pt-1 pb-6 sm:pb-8 mx-auto auto-rows-fr",
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
} as const;
