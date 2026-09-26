/**
 * @file smsPhoneInput.ts
 * @description Centralized styles, dimensions, and classes for the phone number input display.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Max phone number digits for PH mobile format (e.g. 09XXXXXXXXX). */
export const SMS_PHONE_MAX_LENGTH = 11;

/** Default placeholder phone number. */
export const SMS_PHONE_PLACEHOLDER = "0912 345 6780";

/** Inline styles for `PhoneInput`. */
export const SMSPhoneInputStyle = {
    container: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        backgroundColor: themeColors.white,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        borderRadius: 16,
        boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
        paddingLeft: "clamp(16px, 2.5vw, 24px)",
        paddingRight: "clamp(16px, 2.5vw, 24px)",
        height: "clamp(64px, 8vh, 80px)",
    },
    digitsWrapper: {
        flex: 1,
        fontWeight: 900,
        letterSpacing: "0.1em",
        color: "#111827",
        fontSize: "clamp(24px, 3.2vw, 36px)",
        whiteSpace: "nowrap",
        overflow: "hidden",
    },
    placeholder: {
        color: "#D1D5DB",
        fontWeight: 400,
    },
    backspaceBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: themeColors.white,
        backgroundColor: themeColors.brandRed,
        borderRadius: 12,
        paddingLeft: "clamp(16px, 2vw, 20px)",
        paddingRight: "clamp(16px, 2vw, 20px)",
        height: "clamp(44px, 5.5vh, 52px)",
        border: "none",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `PhoneInput`. */
export const SMSPhoneInputClasses = {
    backspaceBtn: "active:scale-95 shadow-md transition-all duration-150 hover:brightness-105",
    backspaceIcon: "sm:size-8",
} as const;
