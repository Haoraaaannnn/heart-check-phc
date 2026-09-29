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
    cardGap: 16,
    cardPaddingX: "clamp(18px, 2.5vw, 28px)",
    cardPaddingY: 16,
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
        fontSize: 56,
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: 36,
        color: cubicleCardColors.arrowColor,
        lineHeight: 1,
    },
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
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
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
} as const;
