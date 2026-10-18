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
    cardBadgeSize: kioskTypography.cardBadge,
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
    cardPaddingX: kioskCardDimensions.cardPaddingX,
    cardPaddingY: kioskCardDimensions.cardPaddingY,
    cardMinHeight: kioskCardDimensions.cardMinHeight,
    gridGap: kioskCardDimensions.gridGap,
    gridPaddingX: kioskCardDimensions.gridPaddingX,
} as const;

/** Inline styles for `PatientTypeCard`. */
export const PatientTypeCardStyle = {
    cardIcon: {
        fontSize: kioskCardDimensions.iconFontSize,
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: kioskCardDimensions.arrowFontSize,
        color: "#D7D6D6",
        lineHeight: 1,
    },
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
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
    labelsWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minWidth: 0,
        paddingLeft: "clamp(6px, 1vmin, 12px)",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    cardTitle: {
        fontWeight: 900,
        fontSize: patientTypeCardTypography.cardTitleSize,
        lineHeight: 1.2,
        color: "#111827",
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
    cardSubtitle: {
        fontSize: patientTypeCardTypography.cardSubtitleSize,
        fontWeight: 600,
        color: patientTypeCardColors.subtitleColor,
        lineHeight: 1.25,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    cardBadge: {
        marginTop: 6,
        width: "fit-content",
        display: "inline-block",
        backgroundColor: "rgba(254, 226, 226, 0.7)",
        border: "1px solid rgba(252, 165, 165, 0.6)",
        color: "#450a0a",
        fontWeight: 700,
        fontSize: patientTypeCardTypography.cardBadgeSize,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 6,
        lineHeight: 1,
    },
    cardsGrid: {
        display: "grid",
        width: "100%",
        gridAutoRows: kioskCardDimensions.gridAutoRows,
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
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-3 sm:px-6 py-2 mx-auto auto-rows-fr",
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    cardIcon: "shrink-0",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
} as const;

