/**
 * @file smsNumPad.ts
 * @description Centralized styles and class names for the on-screen numeric keypad.
 */

import { CSSProperties } from "react";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for SMS keypad, referencing centralized root typography scale. */
export const SMSNumPadTypography = {
    keySize: kioskTypography.numPadKey,
} as const;

/** Inline styles for `NumPad`. */
export const SMSNumPadStyle = {
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gridTemplateRows: "repeat(4, minmax(0, 1fr))",
        gap: "clamp(12px, 1.5vw, 20px)",
        width: "100%",
        maxWidth: "clamp(384px, 40vw, 448px)",
        margin: "0 auto",
    },
    keyButton: {
        width: "100%",
        height: "clamp(64px, 8vh, 88px)",
        backgroundColor: "#F3F4F6",
        borderRadius: 16,
        fontSize: SMSNumPadTypography.keySize,
        fontWeight: 700,
        color: "#111827",
        boxShadow: "0 4px 0 #CBD5E1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `NumPad`. */
export const SMSNumPadClasses = {
    keypadBtn: "transition-all duration-100 active:bg-gray-200 active:translate-y-1 active:shadow-none",
} as const;
