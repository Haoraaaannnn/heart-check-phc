/**
 * @file cubicleCard.ts
 * @description Centralized visual styles and Tailwind utility classes for `CubicleCard`,
 * matching the standardized constant card dimensions and responsive grid layout established by `KioskServicesCard`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";
import { kioskTypography, kioskCardDimensions } from "@/constants/kiosk";

/** Boxicons class tokens for cubicle card elements. */
export const CubicleCardIcons = {
    cubicle: COMMON_ICONS.cubicle,
    doctor: "bx-user",
    arrow: COMMON_ICONS.arrowRight,
    chevronDown: COMMON_ICONS.chevronDown,
} as const;

/** Spacing values for cubicle card and grid, matching unified kiosk card dimensions. */
export const cubicleCardSpacing = {
    cardGap: kioskCardDimensions.cardGap,
    cardPaddingX: kioskCardDimensions.cardPaddingX,
    cardPaddingY: kioskCardDimensions.cardPaddingY,
    cardMinHeight: kioskCardDimensions.cardMinHeight,
    gridGap: kioskCardDimensions.gridGap,
    gridPaddingX: kioskCardDimensions.gridPaddingX,
    gridPaddingY: "clamp(12px, 1.5vh, 20px)",
} as const;

/** Typography tokens for cubicle card, referencing centralized root typography scale. */
export const cubicleCardTypography = {
    cardTitleSize: kioskTypography.cardTitle,
    doctorNameSize: kioskTypography.cardSubtitle,
} as const;

/** Color tokens for cubicle card. */
export const cubicleCardColors = {
    cardTitleText: "#111827",
    doctorNameText: "#4B5563",
    doctorIconColor: themeColors.brandRed,
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB",
    arrowColor: "#D7D6D6",
} as const;

/** Inline styles for `CubicleCard`. */
export const CubicleCardStyle = {
    icon: {
        fontSize: kioskCardDimensions.iconFontSize,
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: kioskCardDimensions.arrowFontSize,
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
        width: kioskCardDimensions.iconWrapperWidth,
    },
    labelWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        paddingLeft: "clamp(6px, 1vmin, 12px)",
        color: cubicleCardColors.cardTitleText,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    titleWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        paddingLeft: "clamp(6px, 1vmin, 12px)",
        color: cubicleCardColors.cardTitleText,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    title: {
        fontWeight: 900,
        fontSize: cubicleCardTypography.cardTitleSize,
        lineHeight: 1.2,
        color: cubicleCardColors.cardTitleText,
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    divider: {
        height: 2,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        marginTop: 6,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: cubicleCardTypography.doctorNameSize,
        fontWeight: 600,
        color: cubicleCardColors.doctorNameText,
        lineHeight: 1.25,
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    doctorWrapper: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
    },
    doctorIcon: {
        fontSize: "clamp(18px, 2vmin, 24px)",
        color: cubicleCardColors.doctorIconColor,
        flexShrink: 0,
        lineHeight: 1,
    },
    doctorName: {
        fontWeight: 600,
        fontSize: cubicleCardTypography.doctorNameSize,
        lineHeight: 1.25,
        color: cubicleCardColors.doctorNameText,
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    grid: {
        display: "grid",
        width: "100%",
        gap: cubicleCardSpacing.gridGap,
        paddingLeft: cubicleCardSpacing.gridPaddingX,
        paddingRight: cubicleCardSpacing.gridPaddingX,
        paddingTop: 2,
        paddingBottom: "clamp(36px, 5vh, 60px)",
        gridAutoRows: kioskCardDimensions.gridAutoRows,
        margin: "0 auto",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `CubicleCard`. */
export const CubicleCardClasses = {
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 xl:landscape:grid-cols-3 gap-4 sm:gap-6 px-3 sm:px-6 pt-1 pb-10 mx-auto auto-rows-fr",
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
} as const;
