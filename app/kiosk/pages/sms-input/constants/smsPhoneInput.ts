/**
 * @file smsPhoneInput.ts
 * @description Centralized styles, dimensions, and classes for the phone number input display.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";
import { kioskTypography } from "@/constants/kiosk";

/** Boxicons class tokens for SMS phone input display. */
export const SMSPhoneInputIcons = {
    backspace: COMMON_ICONS.backspace,
} as const;

/** Max phone number digits for PH mobile format (e.g. 09XXXXXXXXX). */
export const SMS_PHONE_MAX_LENGTH = 11;

/** Default placeholder phone number. */
export const SMS_PHONE_PLACEHOLDER = "0912 345 6780";

/** Typography tokens for SMS phone input, referencing centralized root typography scale. */
export const SMSPhoneInputTypography = {
    digitsSize: kioskTypography.phoneDigits,
} as const;

/** Inline styles for `PhoneInput`. */
export const SMSPhoneInputStyle = {
    backspaceIcon: {
        fontSize: 28,
        lineHeight: 1,
    },
    container: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        backgroundColor: themeColors.white,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#D1D5DB",
        borderRadius: 20,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        paddingLeft: "clamp(16px, 2.5vw, 24px)",
        paddingRight: "clamp(12px, 2vw, 16px)",
        height: "clamp(68px, 8.5vh, 84px)",
    },
    digitsWrapper: {
        flex: 1,
        fontWeight: 900,
        letterSpacing: "0.1em",
        color: "#111827",
        fontSize: SMSPhoneInputTypography.digitsSize,
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
        borderRadius: 14,
        paddingLeft: "clamp(16px, 2vw, 22px)",
        paddingRight: "clamp(16px, 2vw, 22px)",
        height: "clamp(46px, 6vh, 54px)",
        border: "none",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `PhoneInput`. */
export const SMSPhoneInputClasses = {
    backspaceBtn: "active:scale-95 active:brightness-95 shadow-md transition-all duration-150",
    backspaceIcon: "sm:size-8",
} as const;
