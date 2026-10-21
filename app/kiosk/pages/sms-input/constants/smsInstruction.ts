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
        gap: 3,
    },
    title: {
        fontSize: SMSInstructionTypography.title,
        fontWeight: 900,
        color: "#111827",
        lineHeight: 1.15,
        margin: 0,
    },
    subtitle: {
        fontSize: SMSInstructionTypography.subtitle,
        fontWeight: 500,
        color: "#4B5563",
        lineHeight: 1.25,
        margin: 0,
    },
    serviceBadge: {
        marginTop: 4,
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "rgba(254, 226, 226, 0.7)",
        border: "1px solid rgba(252, 165, 165, 0.6)",
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 3,
        paddingBottom: 3,
        borderRadius: 6,
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
        gap: 12,
        width: "100%",
        padding: "10px 16px",
        borderRadius: 14,
        backgroundColor: themeColors.white,
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        marginTop: 6,
        marginBottom: 6,
    },
    hintIcon: {
        fontSize: 26,
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
        fontSize: "clamp(12px, 1.3vw, 14px)",
        fontWeight: 700,
        color: "#111827",
        lineHeight: 1.25,
        margin: 0,
    },
    hintEn: {
        fontSize: "clamp(11px, 1.1vw, 13px)",
        fontWeight: 500,
        color: "#6B7280",
        lineHeight: 1.25,
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
        marginTop: 8,
        marginBottom: 8,
    },
    instructionEn: {
        marginTop: 4,
        fontWeight: 700,
        fontSize: SMSInstructionTypography.instructionEn,
        color: "#4B5563",
        lineHeight: 1.25,
        margin: 0,
    },
    printerNoticeCard: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 14px",
        borderRadius: 14,
        backgroundColor: "#FFFBEB",
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor: "#FCD34D",
        boxSizing: "border-box",
        marginTop: 6,
        marginBottom: 6,
    },
    printerNoticeIcon: {
        fontSize: 24,
        color: "#B45309",
        flexShrink: 0,
    },
    printerNoticeContent: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        textAlign: "left",
    },
    printerNoticeTitle: {
        fontSize: "clamp(12px, 1.3vw, 14px)",
        fontWeight: 800,
        color: "#92400E",
        lineHeight: 1.2,
        margin: 0,
    },
    printerNoticeFil: {
        fontSize: "clamp(11px, 1.2vw, 13px)",
        fontWeight: 600,
        color: "#78350F",
        lineHeight: 1.25,
        margin: 0,
    },
    printerNoticeEn: {
        fontSize: "clamp(10px, 1.1vw, 12px)",
        fontWeight: 500,
        color: "#92400E",
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

