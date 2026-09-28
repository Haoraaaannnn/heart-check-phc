/**
 * @file printFooter.ts
 * @description Centralized visual styles for `PrintFooter`.
 */

import { CSSProperties } from "react";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for print footer notice, referencing centralized root typography scale. */
export const PrintFooterTypography = {
    noticeFilSize: kioskTypography.ticketNoticePrimary,
    noticeEnSize: kioskTypography.ticketNoticeSecondary,
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
        paddingTop: "clamp(12px, 2vh, 16px)",
        paddingBottom: "clamp(12px, 2vh, 16px)",
        textAlign: "center",
    },
    noticeFil: {
        fontWeight: 900,
        fontSize: PrintFooterTypography.noticeFilSize,
        color: "#111827",
        lineHeight: 1.25,
        margin: 0,
    },
    noticeEn: {
        marginTop: 4,
        fontSize: PrintFooterTypography.noticeEnSize,
        color: "#4B5563",
        fontWeight: 700,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
