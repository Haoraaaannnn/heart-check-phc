/**
 * @file printHeader.ts
 * @description Centralized visual styles for `PrintHeader`.
 */

import { CSSProperties } from "react";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for print header, referencing centralized root typography scale. */
export const PrintHeaderTypography = {
    titleSize: "clamp(32px, 3.8vw, 44px)",
    subtitleSize: "clamp(18px, 2vw, 24px)",
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
        paddingTop: "clamp(8px, 1.2vh, 14px)",
        paddingBottom: "clamp(4px, 0.8vh, 8px)",
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
        marginTop: 4,
        fontSize: PrintHeaderTypography.subtitleSize,
        color: "#4B5563",
        fontWeight: 600,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

