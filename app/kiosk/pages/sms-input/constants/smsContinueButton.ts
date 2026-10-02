/**
 * @file smsContinueButton.ts
 * @description Centralized visual styles and Tailwind utility classes for `ContinueButton`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for SMS action buttons, referencing centralized root typography scale. */
export const SMSContinueButtonTypography = {
    buttonTextSize: kioskTypography.buttonText,
    skipTextSize: kioskTypography.buttonSmall,
} as const;

/** Inline styles for `ContinueButton`. */
export const SMSContinueButtonStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: 540,
        margin: "auto",
        marginTop: "auto",
    },
    continueBtn: {
        width: "100%",
        minHeight: "clamp(54px, 6.8vh, 68px)",
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(14px, 1.8vh, 20px)",
        paddingBottom: "clamp(14px, 1.8vh, 20px)",
        textAlign: "center",
        color: themeColors.white,
        fontSize: SMSContinueButtonTypography.buttonTextSize,
        fontWeight: 900,
        borderRadius: 16,
        backgroundColor: themeColors.brandRed,
        border: "none",
        cursor: "pointer",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
    actionsRow: {
        display: "flex",
        gap: "clamp(12px, 1.5vw, 16px)",
        width: "100%",
    },
    cancelBtn: {
        flex: 1,
        width: "100%",
        minHeight: "clamp(50px, 6vh, 62px)",
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(12px, 1.5vh, 18px)",
        paddingBottom: "clamp(12px, 1.5vh, 18px)",
        border: "2px solid #D1D5DB",
        textAlign: "center",
        borderRadius: 16,
        fontWeight: 900,
        color: "#4B5563",
        fontSize: SMSContinueButtonTypography.buttonTextSize,
        backgroundColor: themeColors.white,
        cursor: "pointer",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
    skipBtn: {
        width: "100%",
        minHeight: "clamp(50px, 6vh, 62px)",
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(12px, 1.5vh, 18px)",
        paddingBottom: "clamp(12px, 1.5vh, 18px)",
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#D1D5DB",
        textAlign: "center",
        borderRadius: 16,
        fontWeight: 700,
        color: "#4B5563",
        fontSize: SMSContinueButtonTypography.buttonTextSize,
        backgroundColor: themeColors.white,
        cursor: "pointer",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `ContinueButton`. */
export const SMSContinueButtonClasses = {
    continueBtn: "disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] active:brightness-95 transition-all shadow-md",
    secondaryBtn: "active:scale-[0.98] transition-all active:bg-gray-50 active:!border-[#ED1C24] flex items-center justify-center",
} as const;
