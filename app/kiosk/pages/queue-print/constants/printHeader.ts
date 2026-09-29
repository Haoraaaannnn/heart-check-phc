/**
 * @file printHeader.ts
 * @description Centralized visual styles for `PrintHeader`.
 */

import { CSSProperties } from "react";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for print header, referencing centralized root typography scale. */
export const PrintHeaderTypography = {
    titleSize: kioskTypography.pageTitle,
    subtitleSize: kioskTypography.pageSubtitle,
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
        paddingTop: "clamp(12px, 2vh, 16px)",
        paddingBottom: "clamp(12px, 2vh, 16px)",
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
        color: "#374151",
        fontWeight: 700,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
