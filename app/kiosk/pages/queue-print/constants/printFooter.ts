/**
 * @file printFooter.ts
 * @description Centralized visual styles for `PrintFooter`.
 */

import { CSSProperties } from "react";

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
        paddingTop: "clamp(12px, 2vh, 16px)",
        paddingBottom: "clamp(12px, 2vh, 16px)",
        textAlign: "center",
    },
    noticeFil: {
        fontWeight: 900,
        fontSize: "clamp(14px, 1.4vw, 20px)",
        color: "#111827",
        lineHeight: 1.25,
        margin: 0,
    },
    noticeEn: {
        marginTop: 4,
        fontSize: "clamp(12px, 1.2vw, 16px)",
        color: "#4B5563",
        fontWeight: 700,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
