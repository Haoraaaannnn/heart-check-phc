/**
 * @file queuePrintFallbackStyles.ts
 * @description Centralized visual styles for the on-screen photo ticket fallback card.
 *
 * Adheres strictly to AGENTS.md:
 * - Enterprise solid surfaces with 1px crisp borders (Rule 10).
 * - Senior-friendly touch targets with rounded-xl buttons (Rule 9).
 * - Zero blurry glassmorphism, zero pillboxes (Rule 10).
 * - Fully typed CSSProperties dictionary (Rule 2).
 * - Responsive fluid viewport-height (`vh`) clamps ensuring zero scrolling on both
 *   landscape and portrait kiosks.
 *
 * @module app/kiosk/pages/queue-print/constants/queuePrintFallbackStyles
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Visual styles for `QueuePrintFallbackCard`. */
export const QueuePrintFallbackStyles = {
    /** Outer wrapper for the fallback panel positioned alongside or below the ticket. */
    fallbackWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: 480,
        gap: "clamp(6px, 1vh, 10px)",
        marginTop: 0,
        boxSizing: "border-box",
        flexShrink: 1,
    },
    /** Prominent status alert banner indicating why physical printing was skipped. */
    statusBanner: {
        display: "flex",
        alignItems: "center",
        gap: "clamp(8px, 1.2vw, 12px)",
        width: "100%",
        padding: "clamp(8px, 1.2vh, 12px) clamp(12px, 1.6vw, 16px)",
        borderRadius: 12,
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#FCD34D",
        boxSizing: "border-box",
        textAlign: "left",
    },
    /** Icon for the status warning banner. */
    statusBannerIcon: {
        fontSize: "clamp(18px, 2.4vh, 22px)",
        color: "#B45309",
        flexShrink: 0,
    },
    /** Text container for status warning banner. */
    statusBannerContent: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    /** Heading in status warning banner. */
    statusBannerTitle: {
        fontSize: "clamp(12px, 1.5vh, 14px)",
        fontWeight: 800,
        color: "#92400E",
        lineHeight: 1.25,
        margin: 0,
    },
    /** Reason explanation in status warning banner. */
    statusBannerReason: {
        fontSize: "clamp(11px, 1.3vh, 13px)",
        fontWeight: 600,
        color: "#78350F",
        lineHeight: 1.25,
        margin: 0,
    },
    /** Action guidance block instructing patient to photograph their ticket. */
    photoInstructionCard: {
        display: "flex",
        alignItems: "center",
        gap: "clamp(8px, 1.2vw, 12px)",
        width: "100%",
        padding: "clamp(8px, 1.2vh, 12px) clamp(12px, 1.6vw, 16px)",
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#E2E8F0",
        boxSizing: "border-box",
        textAlign: "left",
    },
    /** Camera icon for photo guidance. */
    photoIcon: {
        fontSize: "clamp(24px, 3vh, 28px)",
        color: themeColors.brandRed,
        flexShrink: 0,
    },
    /** Text column for photo guidance. */
    photoTextCol: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    /** Filipino headline for photo guidance. */
    photoInstructionFil: {
        fontSize: "clamp(12px, 1.5vh, 14px)",
        fontWeight: 800,
        color: "#0F172A",
        lineHeight: 1.25,
        margin: 0,
    },
    /** English secondary line for photo guidance. */
    photoInstructionEn: {
        fontSize: "clamp(11px, 1.3vh, 12px)",
        fontWeight: 500,
        color: "#475569",
        lineHeight: 1.25,
        margin: 0,
    },

    /** Bottom container wrapping the Finish button and countdown timer. */
    bottomControls: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(3px, 0.5vh, 6px)",
        width: "100%",
        marginTop: 2,
    },
    /** High-contrast primary finish button. */
    finishButton: {
        height: "clamp(40px, 4.8vh, 48px)",
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#0F172A",
        color: themeColors.white,
        fontSize: "clamp(14px, 1.7vh, 16px)",
        fontWeight: 800,
        borderWidth: 0,
        borderRadius: 12,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    },
    /** Icon inside the finish button. */
    finishButtonIcon: {
        fontSize: "clamp(18px, 2.3vh, 22px)",
    },
    /** Live auto-close countdown timer notice text. */
    countdownNotice: {
        fontSize: "clamp(11px, 1.3vh, 13px)",
        fontWeight: 600,
        color: "#64748B",
        lineHeight: 1.25,
        margin: 0,
        textAlign: "center",
    },
} satisfies Record<string, CSSProperties>;

