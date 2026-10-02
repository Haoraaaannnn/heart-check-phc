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
        gap: "clamp(12px, 1.6vw, 20px)",
        width: "100%",
        maxWidth: "clamp(360px, 40vw, 460px)",
        margin: "0 auto",
    },
    keyButton: {
        width: "100%",
        height: "clamp(70px, 8.5vh, 90px)",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        fontSize: SMSNumPadTypography.keySize,
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
