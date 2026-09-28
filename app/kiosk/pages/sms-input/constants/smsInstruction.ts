/**
 * @file smsInstruction.ts
 * @description Centralized visual styles for the SMS instruction panel.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for SMS instruction header and hint card, referencing centralized root typography scale. */
export const SMSInstructionTypography = {
    title: kioskTypography.pageTitle,
    subtitle: kioskTypography.pageSubtitle,
    badge: kioskTypography.badgeMedium,
    instructionFil: kioskTypography.instructionPrimary,
    instructionEn: kioskTypography.instructionSecondary,
} as const;

/** Inline styles for `SMSInstruction` and page header. */
export const SMSInstructionStyle = {
    header: {
        textAlign: "center",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
    },
    title: {
        fontSize: SMSInstructionTypography.title,
        fontWeight: 900,
        color: "#111827",
        lineHeight: 1.2,
        margin: 0,
    },
    subtitle: {
        fontSize: SMSInstructionTypography.subtitle,
        fontWeight: 500,
        color: "#4B5563",
        lineHeight: 1.3,
        margin: 0,
    },
    serviceBadge: {
        marginTop: 6,
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "rgba(254, 226, 226, 0.7)",
        border: "1px solid rgba(252, 165, 165, 0.6)",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
    },
    serviceBadgeText: {
        color: "#991B1B",
        fontWeight: 700,
        fontSize: SMSInstructionTypography.badge,
        lineHeight: 1.2,
    },
    hintCard: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        padding: "16px 20px",
        borderRadius: 16,
        backgroundColor: themeColors.white,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    },
    hintIcon: {
        fontSize: 32,
        color: themeColors.brandRed,
        flexShrink: 0,
    },
    hintContent: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        textAlign: "left",
    },
    hintFil: {
        fontSize: SMSInstructionTypography.instructionEn,
        fontWeight: 700,
        color: "#111827",
        lineHeight: 1.3,
        margin: 0,
    },
    hintEn: {
        fontSize: SMSInstructionTypography.instructionEn,
        fontWeight: 500,
        color: "#6B7280",
        lineHeight: 1.3,
        margin: 0,
    },
    container: {
        width: "100%",
        textAlign: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
        backgroundColor: themeColors.white,
        borderRadius: 16,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    instructionFil: {
        fontWeight: 900,
        fontSize: SMSInstructionTypography.instructionFil,
        color: "#111827",
        lineHeight: 1.25,
        margin: 0,
    },
    divider: {
        height: 1,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 9999,
        marginTop: 10,
        marginBottom: 10,
    },
    instructionEn: {
        marginTop: 6,
        fontWeight: 700,
        fontSize: SMSInstructionTypography.instructionEn,
        color: "#4B5563",
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
