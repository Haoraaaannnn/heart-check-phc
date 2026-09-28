/**
 * @file patientTypeCards.ts
 * @description Centralized visual styles and Tailwind utility classes for `PatientTypeCards`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { PATIENT_TYPE_ICONS, COMMON_ICONS } from "@/constants/icons";
import { kioskTypography } from "@/constants/kiosk";

/** Boxicons class tokens for patient category card elements. */
export const PatientTypeCardIcons = {
    ...PATIENT_TYPE_ICONS,
    arrow: COMMON_ICONS.arrowRight,
    fallback: COMMON_ICONS.fallback,
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

/** Inline styles for `PatientTypeCard`. */
export const PatientTypeCardStyle = {
    cardIcon: {
        fontSize: 72,
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: 36,
        color: "#D7D6D6",
        lineHeight: 1,
    },
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#D1D5DB",
        backgroundColor: themeColors.white,
        paddingLeft: "clamp(20px, 2.5vw, 32px)",
        paddingRight: "clamp(20px, 2.5vw, 32px)",
        paddingTop: 20,
        paddingBottom: 20,
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
    labelsWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minWidth: 0,
        paddingLeft: 8,
    },
    cardTitle: {
        fontWeight: 900,
        fontSize: patientTypeCardTypography.cardTitleSize,
        lineHeight: 1.2,
        color: "#111827",
        overflow: "hidden",
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
        lineHeight: 1.3,
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
        borderRadius: 9999,
        lineHeight: 1,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `PatientTypeCards`. */
export const PatientTypeCardsClasses = {
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 py-4",
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    cardIcon: "sm:size-16",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
} as const;
