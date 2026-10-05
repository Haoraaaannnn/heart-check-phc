/**
 * @file printFooter.ts
 * @description Centralized visual styles for `PrintFooter`.
 */

import { CSSProperties } from "react";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for print footer notice, referencing centralized root typography scale. */
export const PrintFooterTypography = {
    noticeFilSize: "clamp(18px, 2vw, 24px)",
    noticeEnSize: "clamp(15px, 1.6vw, 19px)",
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
        paddingTop: "clamp(6px, 1vh, 10px)",
        paddingBottom: "clamp(6px, 1.2vh, 12px)",
        textAlign: "center",
    },
    noticeFil: {
        fontWeight: 800,
        fontSize: PrintFooterTypography.noticeFilSize,
        color: "#111827",
        lineHeight: 1.3,
        margin: 0,
    },
    noticeEn: {
        marginTop: 2,
        fontSize: PrintFooterTypography.noticeEnSize,
        color: "#4B5563",
        fontWeight: 600,
        lineHeight: 1.3,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

