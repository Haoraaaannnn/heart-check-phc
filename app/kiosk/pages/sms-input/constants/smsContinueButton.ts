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
        flexDirection: "row",
        alignItems: "center",
        gap: "clamp(8px, 1.2vw, 12px)",
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
    },
    actionsRow: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "clamp(8px, 1.2vw, 12px)",
        width: "100%",
    },
    continueBtn: {
        flex: "1 1 0px",
        minWidth: 0,
        width: "100%",
        height: "clamp(48px, 5.6vh, 60px)",
        minHeight: "clamp(48px, 5.6vh, 60px)",
        paddingLeft: "clamp(8px, 1.2vw, 14px)",
        paddingRight: "clamp(8px, 1.2vw, 14px)",
        paddingTop: "clamp(8px, 1vh, 12px)",
        paddingBottom: "clamp(8px, 1vh, 12px)",
        textAlign: "center",
        color: themeColors.white,
        fontSize: "clamp(13px, 1.5vw, 17px)",
        fontWeight: 800,
        borderRadius: 14,
        backgroundColor: themeColors.brandRed,
        border: "2px solid transparent",
        boxSizing: "border-box",
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtn: {
        flex: "1 1 0px",
        minWidth: 0,
        width: "100%",
        height: "clamp(48px, 5.6vh, 60px)",
        minHeight: "clamp(48px, 5.6vh, 60px)",
        paddingLeft: "clamp(8px, 1.2vw, 14px)",
        paddingRight: "clamp(8px, 1.2vw, 14px)",
        paddingTop: "clamp(8px, 1vh, 12px)",
        paddingBottom: "clamp(8px, 1vh, 12px)",
        border: "2px solid #D1D5DB",
        boxSizing: "border-box",
        textAlign: "center",
        borderRadius: 14,
        fontWeight: 800,
        color: "#4B5563",
        fontSize: "clamp(13px, 1.5vw, 17px)",
        backgroundColor: themeColors.white,
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    skipBtn: {
        flex: "1 1 0px",
        minWidth: 0,
        width: "100%",
        height: "clamp(48px, 5.6vh, 60px)",
        minHeight: "clamp(48px, 5.6vh, 60px)",
        paddingLeft: "clamp(8px, 1.2vw, 14px)",
        paddingRight: "clamp(8px, 1.2vw, 14px)",
        paddingTop: "clamp(8px, 1vh, 12px)",
        paddingBottom: "clamp(8px, 1vh, 12px)",
        border: "2px solid #D1D5DB",
        boxSizing: "border-box",
        textAlign: "center",
        borderRadius: 14,
        fontWeight: 700,
        color: "#4B5563",
        fontSize: "clamp(13px, 1.5vw, 17px)",
        backgroundColor: themeColors.white,
        cursor: "pointer",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `ContinueButton`. */
export const SMSContinueButtonClasses = {
    continueBtn: "flex-1 w-full disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] active:brightness-95 transition-all shadow-md",
    secondaryBtn: "flex-1 w-full active:scale-[0.98] transition-all active:bg-gray-50 active:!border-[#ED1C24] flex items-center justify-center",
} as const;
