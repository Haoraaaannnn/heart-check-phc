/**
 * @file patientTypeCards.ts
 * @description Centralized visual styles and Tailwind utility classes for `PatientTypeCards`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Typography tokens for patient type cards. */
export const patientTypeCardTypography = {
    cardTitleSize: "clamp(22px, 2vw, 30px)",
    cardBadgeSize: "clamp(13px, 1.2vw, 18px)",
} as const;

/** Color tokens for patient type cards. */
export const patientTypeCardColors = {
    white: themeColors.white,
    arrowColor: "#D7D6D6",
} as const;

/** Inline styles for `PatientTypeCard`. */
export const PatientTypeCardStyle = {
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
        flexShrink: 0,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        backgroundColor: themeColors.brandRed,
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
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
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
    card: "group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-md",
    cardIconWrapper: "transition-transform group-hover:scale-105",
    cardIcon: "sm:size-16",
    cardArrow: "shrink-0 transition-transform group-hover:translate-x-1",
} as const;
