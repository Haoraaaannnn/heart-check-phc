/**
 * @file patientTypeCards.ts
 * @description Centralized visual styles and Tailwind utility classes for `PatientTypeCards`,
 * matching the standardized constant card dimensions and responsive grid layout established by `KioskServicesCard`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { PATIENT_TYPE_ICONS, COMMON_ICONS } from "@/constants/icons";
import { kioskTypography, kioskCardDimensions } from "@/constants/kiosk";

/** Boxicons class tokens for patient category card elements. */
export const PatientTypeCardIcons = {
    ...PATIENT_TYPE_ICONS,
    arrow: COMMON_ICONS.arrowRight,
    fallback: COMMON_ICONS.fallback,
    chevronDown: COMMON_ICONS.chevronDown,
} as const;

/** Typography tokens for patient type cards, referencing centralized root typography scale. */
export const patientTypeCardTypography = {
    cardTitleSize: kioskTypography.cardTitle,
    cardSubtitleSize: kioskTypography.cardSubtitle,
    cardBadgeSize: "clamp(11px, 1.1vw, 13px)",
} as const;

/** Color tokens for patient type cards. */
export const patientTypeCardColors = {
    white: themeColors.white,
    arrowColor: "#D7D6D6",
    subtitleColor: "#4B5563",
} as const;

/** Spacing values for patient type cards matching unified kiosk card dimensions. */
export const patientTypeCardSpacing = {
    cardGap: kioskCardDimensions.cardGap,
    cardPaddingX: "clamp(18px, 2.5vmin, 28px)",
    cardPaddingY: "clamp(18px, 2.2vh, 26px)",
    cardMinHeight: "clamp(120px, 14vh, 160px)",
    gridGap: "clamp(16px, 2vmin, 24px)",
    gridPaddingX: kioskCardDimensions.gridPaddingX,
} as const;

/** Inline styles for `PatientTypeCard`. */
export const PatientTypeCardStyle = {
    card: {
        position: "relative",
        display: "flex",
        width: "fit-content",
        minHeight: patientTypeCardSpacing.cardMinHeight,
        alignItems: "center",
        gap: patientTypeCardSpacing.cardGap,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#D1D5DB",
        backgroundColor: themeColors.white,
        paddingLeft: patientTypeCardSpacing.cardPaddingX,
        paddingRight: patientTypeCardSpacing.cardPaddingX,
        paddingTop: patientTypeCardSpacing.cardPaddingY,
        paddingBottom: patientTypeCardSpacing.cardPaddingY,
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
    cardIcon: {
        fontSize: kioskCardDimensions.iconFontSize,
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    labelsWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        paddingLeft: "clamp(4px, 0.8vmin, 8px)",
        paddingRight: "clamp(8px, 1.2vmin, 16px)",
    },
    cardTitle: {
        fontWeight: 900,
        fontSize: patientTypeCardTypography.cardTitleSize,
        lineHeight: 1.2,
        color: themeColors.black,
        whiteSpace: "nowrap",
    },
    divider: {
        height: 2,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        marginTop: 6,
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: patientTypeCardTypography.cardSubtitleSize,
        fontWeight: 600,
        color: patientTypeCardColors.subtitleColor,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
    },
    arrowIcon: {
        fontSize: kioskCardDimensions.arrowFontSize,
        color: patientTypeCardColors.arrowColor,
        lineHeight: 1,
        flexShrink: 0,
        marginLeft: "auto",
    },
    cardsGrid: {
        display: "flex",
        width: "fit-content",
        gap: patientTypeCardSpacing.gridGap,
        paddingLeft: patientTypeCardSpacing.gridPaddingX,
        paddingRight: patientTypeCardSpacing.gridPaddingX,
        paddingTop: 2,
        paddingBottom: "clamp(24px, 3vh, 40px)",
        margin: "0 auto",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `PatientTypeCards`. */
export const PatientTypeCardsClasses = {
    grid: "flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-2 sm:px-4 py-2 mx-auto w-fit max-w-full",
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm select-none w-fit",
    cardIconWrapper: "shrink-0",
    cardIcon: "shrink-0",
    cardArrow: "shrink-0 ml-auto transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1 group-hover:text-[#ED1C24]",
} as const;




