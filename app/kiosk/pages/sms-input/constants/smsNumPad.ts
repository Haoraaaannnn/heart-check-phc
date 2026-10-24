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
        gap: "clamp(6px, 1.2vh, 12px)",
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
    },
    keyButton: {
        width: "100%",
        height: "clamp(50px, 6.2vh, 72px)",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: "clamp(22px, 2.8vh, 34px)",
        fontWeight: 700,
        color: "#111827",
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `NumPad`. */
export const SMSNumPadClasses = {
    keypadBtn: "transition-all duration-100 active:scale-95 active:!border-[#ED1C24] active:bg-gray-50 active:shadow-none",
} as const;
