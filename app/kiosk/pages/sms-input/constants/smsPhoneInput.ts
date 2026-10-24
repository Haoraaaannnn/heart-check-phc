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
    warning: "bx-error-circle",
    check: COMMON_ICONS.check,
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
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        backgroundColor: themeColors.white,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#D1D5DB",
        borderRadius: 16,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        paddingLeft: "clamp(12px, 1.8vw, 18px)",
        paddingRight: "clamp(10px, 1.4vw, 14px)",
        height: "clamp(54px, 6.4vh, 72px)",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
    },
    containerError: {
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
    },
    containerValid: {
        borderColor: "#10B981",
        backgroundColor: "#F0FDF4",
    },
    digitsWrapper: {
        flex: 1,
        minWidth: 0,
        fontWeight: 900,
        letterSpacing: "0.06em",
        color: "#111827",
        fontSize: "clamp(22px, 2.6vw, 36px)",
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
        paddingLeft: "clamp(12px, 1.6vw, 20px)",
        paddingRight: "clamp(12px, 1.6vw, 20px)",
        height: "clamp(44px, 5.2vh, 56px)",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
    },
    feedbackContainer: {
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        paddingTop: 4,
        paddingLeft: 4,
        paddingRight: 4,
    },
    feedbackIcon: {
        fontSize: 16,
        color: "#DC2626",
        flexShrink: 0,
        marginTop: 1,
    },
    feedbackTextWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
    },
    feedbackFil: {
        fontSize: "clamp(11px, 1.2vw, 13px)",
        fontWeight: 600,
        color: "#DC2626",
        lineHeight: 1.2,
        margin: 0,
    },
    feedbackEn: {
        fontSize: "clamp(10px, 1.1vw, 12px)",
        fontWeight: 400,
        color: "#6B7280",
        lineHeight: 1.2,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `PhoneInput`. */
export const SMSPhoneInputClasses = {
    backspaceBtn: "active:scale-95 active:brightness-95 shadow-md transition-all duration-150",
    backspaceIcon: "sm:size-8",
} as const;
