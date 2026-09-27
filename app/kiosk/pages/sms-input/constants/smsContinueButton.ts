/**
 * @file smsContinueButton.ts
 * @description Centralized visual styles and Tailwind utility classes for `ContinueButton`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Inline styles for `ContinueButton`. */
export const SMSContinueButtonStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: 500,
        margin: "auto",
        marginTop: "auto",
    },
    continueBtn: {
        width: "100%",
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        textAlign: "center",
        color: themeColors.white,
        fontSize: "clamp(18px, 1.8vw, 24px)",
        fontWeight: 900,
        borderRadius: 16,
        backgroundColor: themeColors.brandRed,
        border: "none",
        cursor: "pointer",
    },
    actionsRow: {
        display: "flex",
        gap: "clamp(12px, 1.5vw, 16px)",
        width: "100%",
    },
    cancelBtn: {
        flex: 1,
        width: "100%",
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 14,
        paddingBottom: 14,
        border: "2px solid #D1D5DB",
        textAlign: "center",
        borderRadius: 16,
        fontWeight: 900,
        color: "#4B5563",
        fontSize: "clamp(18px, 1.8vw, 24px)",
        backgroundColor: themeColors.white,
        cursor: "pointer",
    },
    skipBtn: {
        width: "fit-content",
        color: "#6B7280",
        fontWeight: 700,
        fontSize: "clamp(15px, 1.4vw, 18px)",
        textDecoration: "underline",
        background: "none",
        border: "none",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `ContinueButton`. */
export const SMSContinueButtonClasses = {
    continueBtn: "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md hover:brightness-105",
    secondaryBtn: "flex-1 active:scale-95 transition-all hover:bg-gray-50 flex items-center justify-center",
} as const;
