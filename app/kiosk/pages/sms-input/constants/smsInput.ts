import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { smsInputTexts } from "./smsInputTexts";

/** Max phone number digits for PH mobile format (e.g. 09XXXXXXXXX). */
export const SMS_PHONE_MAX_LENGTH = 11;

/** Default placeholder phone number. */
export const SMS_PHONE_PLACEHOLDER = "0912 345 6780";

/** Service prefix mapping for queue numbers. */
export const SMS_SERVICE_PREFIXES: Record<string, string> = {
    "OPD Card": "O",
    "Refill Prescription": "R",
    "Warfarin": "W",
    "OPD Reschedule": "S",
    "Benzathine": "B",
};

/** Rule definition for generating numeric prefixes per service/category. */
export type NumericPrefixRule = {
    match: (serviceName: string, subcategory?: string) => boolean;
    prefix: string;
    groupBySubcategory: boolean;
};

/** Queue code prefix rules. */
export const NUMERIC_PREFIX_RULES: NumericPrefixRule[] = [
    { match: (s) => s === "OPD Screening", prefix: "1", groupBySubcategory: false },
    { match: (s, sub) => s === "Consultation" && sub === "Pedia", prefix: "2", groupBySubcategory: true },
    { match: (s, sub) => s === "Consultation" && sub === "Adult", prefix: "4", groupBySubcategory: true },
    { match: (s) => s === "ECG", prefix: "5", groupBySubcategory: false },
];

/** Theme colors for SMS input components. */
export const smsInputTheme = {
    primaryColor: themeColors.brandRed,
    white: themeColors.white,
    darkText: "#111827",
    subtitleText: "#4B5563",
    cancelBorder: "#D1D5DB",
    skipText: "#6B7280",
    pillBg: "rgba(255, 255, 255, 0.2)",
    pillBorder: "rgba(255, 255, 255, 0.35)",
};

/** Inline styles for `SMSBanner`. */
export const SMSBannerStyle = {
    banner: {
        position: "relative",
        zIndex: 10,
        width: "100%",
        paddingLeft: "clamp(16px, 2vw, 32px)",
        paddingRight: "clamp(16px, 2vw, 32px)",
        paddingTop: "clamp(12px, 1.5vh, 16px)",
        paddingBottom: "clamp(12px, 1.5vh, 16px)",
        color: smsInputTheme.white,
        backgroundColor: smsInputTheme.primaryColor,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    content: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    },
    labelFil: {
        fontWeight: 900,
        fontSize: "clamp(24px, 2.5vw, 36px)",
        lineHeight: 1.2,
        marginBottom: 4,
        color: smsInputTheme.white,
    },
    labelEn: {
        width: "fit-content",
        display: "inline-block",
        backgroundColor: smsInputTheme.pillBg,
        border: `1px solid ${smsInputTheme.pillBorder}`,
        color: smsInputTheme.white,
        fontSize: "clamp(12px, 1.2vw, 16px)",
        fontWeight: 700,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 9999,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `SMSInstruction`. */
export const SMSInstructionStyle = {
    container: {
        width: "100%",
        textAlign: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    instructionFil: {
        fontWeight: 900,
        fontSize: "clamp(20px, 2.2vw, 30px)",
        color: smsInputTheme.darkText,
        lineHeight: 1.25,
        margin: 0,
    },
    instructionEn: {
        marginTop: 6,
        fontWeight: 700,
        fontSize: "clamp(15px, 1.5vw, 20px)",
        color: smsInputTheme.subtitleText,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

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
    },
    continueBtn: {
        width: "100%",
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        textAlign: "center",
        color: smsInputTheme.white,
        fontSize: "clamp(18px, 1.8vw, 24px)",
        fontWeight: 900,
        borderRadius: 16,
        backgroundColor: smsInputTheme.primaryColor,
        border: "none",
        cursor: "pointer",
    },
    cancelBtn: {
        width: "100%",
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 14,
        paddingBottom: 14,
        border: `2px solid ${smsInputTheme.cancelBorder}`,
        textAlign: "center",
        borderRadius: 16,
        fontWeight: 900,
        color: smsInputTheme.subtitleText,
        fontSize: "clamp(18px, 1.8vw, 24px)",
        backgroundColor: smsInputTheme.white,
        cursor: "pointer",
    },
    skipBtn: {
        width: "fit-content",
        color: smsInputTheme.skipText,
        fontWeight: 700,
        fontSize: "clamp(15px, 1.4vw, 18px)",
        textDecoration: "underline",
        background: "none",
        border: "none",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;
