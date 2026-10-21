/**
 * @file printFooter.ts
 * @description Centralized visual styles for `PrintFooter` on `/kiosk/pages/queue-print`.
 *
 * Rendered during physical ticket printing dispatch. Uses responsive fluid viewport-height
 * (`vh`) clamps to ensure high clinical readability without inducing vertical overflow.
 *
 * @module app/kiosk/pages/queue-print/constants/printFooter
 */

import { CSSProperties } from "react";

/** Typography tokens for print footer notice, referencing fluid responsive clamps. */
export const PrintFooterTypography = {
    noticeFilSize: "clamp(15px, 2vh, 20px)",
    noticeEnSize: "clamp(13px, 1.6vh, 16px)",
} as const;

/** Inline styles for `PrintFooter`. */
export const PrintFooterStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        flexShrink: 0,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: "clamp(6px, 0.8vh, 10px)",
        paddingBottom: "clamp(6px, 0.8vh, 10px)",
        textAlign: "center",
    },
    noticeFil: {
        fontWeight: 800,
        fontSize: PrintFooterTypography.noticeFilSize,
        color: "#111827",
        lineHeight: 1.25,
        margin: 0,
    },
    noticeEn: {
        marginTop: 2,
        fontSize: PrintFooterTypography.noticeEnSize,
        color: "#4B5563",
        fontWeight: 600,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;


