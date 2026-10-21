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
        gap: "clamp(8px, 1.2vh, 12px)",
        width: "100%",
        maxWidth: 540,
        margin: "0 auto",
    },
    continueBtn: {
        width: "100%",
        minHeight: "clamp(46px, 5.5vh, 58px)",
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(10px, 1.2vh, 16px)",
        paddingBottom: "clamp(10px, 1.2vh, 16px)",
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
        gap: "clamp(10px, 1.2vw, 14px)",
        width: "100%",
    },
    cancelBtn: {
        flex: 1,
        width: "100%",
        minHeight: "clamp(42px, 5vh, 52px)",
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(8px, 1vh, 14px)",
        paddingBottom: "clamp(8px, 1vh, 14px)",
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
        minHeight: "clamp(42px, 5vh, 52px)",
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(8px, 1vh, 14px)",
        paddingBottom: "clamp(8px, 1vh, 14px)",
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
