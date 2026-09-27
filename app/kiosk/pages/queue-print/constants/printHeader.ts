/**
 * @file printHeader.ts
 * @description Centralized visual styles for `PrintHeader`.
 */

import { CSSProperties } from "react";

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
        fontSize: "clamp(24px, 3.2vw, 44px)",
        color: "#111827",
        lineHeight: 1.2,
        margin: 0,
    },
    subtitle: {
        marginTop: 4,
        fontSize: "clamp(18px, 2.2vw, 28px)",
        color: "#374151",
        fontWeight: 700,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
