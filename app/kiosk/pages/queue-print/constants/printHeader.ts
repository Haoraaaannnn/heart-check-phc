/**
 * @file printHeader.ts
 * @description Centralized visual styles for `PrintHeader` on `/kiosk/pages/queue-print`.
 *
 * Sized with responsive fluid viewport-height (`vh`) clamps to ensure the header
 * remains prominent and legible while preserving maximum vertical space for the
 * queue ticket card in both landscape and portrait orientations.
 *
 * @module app/kiosk/pages/queue-print/constants/printHeader
 */

import { CSSProperties } from "react";

/** Typography tokens for print header, referencing responsive fluid clamps. */
export const PrintHeaderTypography = {
    titleSize: "clamp(24px, 3.2vh, 36px)",
    subtitleSize: "clamp(14px, 1.8vh, 20px)",
} as const;

/** Inline styles for `PrintHeader`. */
export const PrintHeaderStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        flexShrink: 0,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: "clamp(6px, 1vh, 12px)",
        paddingBottom: "clamp(3px, 0.5vh, 8px)",
        textAlign: "center",
    },
    title: {
        fontWeight: 900,
        fontSize: PrintHeaderTypography.titleSize,
        color: "#111827",
        lineHeight: 1.2,
        margin: 0,
    },
    subtitle: {
        marginTop: 2,
        fontSize: PrintHeaderTypography.subtitleSize,
        color: "#4B5563",
        fontWeight: 600,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;


