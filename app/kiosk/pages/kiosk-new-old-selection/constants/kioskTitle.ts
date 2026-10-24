/**
 * @file kioskTitle.ts
 * @description Centralized visual styles and Tailwind utility classes for `KioskTitle`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for kiosk title, referencing centralized root typography scale. */
export const kioskTitleTypography = {
    titleSize: kioskTypography.heroTitle,
    eyebrowSize: "clamp(10px, 1.1vw, 13px)",
} as const;

/** Inline styles for `KioskTitle`. */
export const KioskTitleStyle = {
    container: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(4px, 0.8vh, 8px)",
    },
    eyebrowWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
    },
    eyebrow: {
        fontSize: kioskTitleTypography.eyebrowSize,
        fontWeight: 800,
        color: "#64748B",
        lineHeight: 1.2,
        letterSpacing: "0.15em",
        whiteSpace: "nowrap",
    },
    titleWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        whiteSpace: "nowrap",
    },
    title: {
        fontWeight: 900,
        fontSize: kioskTitleTypography.titleSize,
        color: "#0F172A",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
    },
    titleAccent: {
        color: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `KioskTitle`. */
export const KioskTitleClasses = {
    eyebrow: "select-none uppercase",
    titleStroke: "[-webkit-text-stroke:0.5px_currentColor] select-none",
} as const;

