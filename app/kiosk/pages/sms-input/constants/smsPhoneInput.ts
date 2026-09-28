/**
 * @file smsPhoneInput.ts
 * @description Centralized styles, dimensions, and classes for the phone number input display.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";

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
        borderColor: "#E5E7EB",
        borderRadius: 16,
        boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
        paddingLeft: "clamp(16px, 2.5vw, 24px)",
        paddingRight: "clamp(16px, 2.5vw, 24px)",
        height: "clamp(64px, 8vh, 80px)",
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
    feedbackContainer: {
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        paddingTop: 8,
        paddingLeft: 4,
        paddingRight: 4,
    },
    feedbackIcon: {
        fontSize: 20,
        color: "#DC2626",
        flexShrink: 0,
        marginTop: 2,
    },
    feedbackTextWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    feedbackFil: {
        fontSize: "clamp(13px, 1.6vw, 15px)",
        fontWeight: 600,
        color: "#DC2626",
        lineHeight: 1.3,
        margin: 0,
    },
    feedbackEn: {
        fontSize: "clamp(12px, 1.4vw, 14px)",
        fontWeight: 400,
        color: "#6B7280",
        lineHeight: 1.3,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `PhoneInput`. */
export const SMSPhoneInputClasses = {
    backspaceBtn: "active:scale-95 shadow-md transition-all duration-150 hover:brightness-105",
    backspaceIcon: "sm:size-8",
} as const;
