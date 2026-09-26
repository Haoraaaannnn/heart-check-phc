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
        paddingTop: 12,
        paddingBottom: 12,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
        backgroundColor: smsInputTheme.white,
        borderRadius: 16,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    instructionFil: {
        fontWeight: 900,
        fontSize: "clamp(20px, 2.2vw, 30px)",
        color: smsInputTheme.darkText,
        lineHeight: 1.25,
        margin: 0,
    },
    divider: {
        height: 1,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 9999,
        marginTop: 10,
        marginBottom: 10,
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

/** Inline styles for `PhoneInput`. */
export const SMSPhoneInputStyle = {
    container: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        backgroundColor: smsInputTheme.white,
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
        color: smsInputTheme.darkText,
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
        color: smsInputTheme.white,
        backgroundColor: smsInputTheme.primaryColor,
        borderRadius: 12,
        paddingLeft: "clamp(16px, 2vw, 20px)",
        paddingRight: "clamp(16px, 2vw, 20px)",
        height: "clamp(44px, 5.5vh, 52px)",
        border: "none",
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `NumPad`. */
export const SMSNumPadStyle = {
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gridTemplateRows: "repeat(4, minmax(0, 1fr))",
        gap: "clamp(12px, 1.5vw, 20px)",
        width: "100%",
        maxWidth: "clamp(384px, 40vw, 448px)",
        margin: "0 auto",
    },
    keyButton: {
        width: "100%",
        height: "clamp(64px, 8vh, 88px)",
        backgroundColor: "#F3F4F6",
        borderRadius: 16,
        fontSize: "clamp(30px, 3.8vw, 48px)",
        fontWeight: 700,
        color: "#111827",
        boxShadow: "0 4px 0 #CBD5E1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        cursor: "pointer",
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
        marginTop: "auto",
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

/**
 * Tailwind CSS class name dictionary for SMS input components.
 *
 * Centralizes interactive button states, transitions, keypad presses,
 * and responsive grid layouts so that consumer UI files avoid hardcoding raw utility strings.
 */
export const SMSInputClasses = {
    backspaceBtn: "active:scale-95 shadow-md transition-all duration-150 hover:brightness-105",
    backspaceIcon: "sm:size-8",
    keypadBtn: "hover:bg-gray-200 transition-all duration-100 active:translate-y-1 active:shadow-none",
    continueBtn: "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md hover:brightness-105",
    secondaryBtn: "flex-1 active:scale-95 transition-all hover:bg-gray-50 flex items-center justify-center",
    pageContainer: "h-full w-full flex flex-col overflow-hidden bg-white p-0",
    pageContent: "flex flex-col w-full h-full gap-2 md:gap-4 overflow-hidden",
    pageBannerWrapper: "flex-none",
    pageEntryWrapper: "flex-1 min-h-0 h-full flex flex-col overflow-hidden",
    layoutContainer: "h-full w-full flex flex-col overflow-hidden",
    entryGrid: "h-full min-h-0 w-full grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 md:gap-6 p-4 md:p-6 overflow-hidden bg-white landscape:grid-cols-[1.2fr_1fr] landscape:grid-rows-[auto_minmax(0,1fr)_auto] landscape:gap-x-12 landscape:gap-y-6",
    entryLeftCol: "flex w-full flex-col gap-3 sm:gap-4 landscape:col-start-1 landscape:row-start-1 landscape:row-span-2 landscape:justify-center landscape:items-start",
    entryRightCol: "flex h-full w-full items-center justify-center portrait:py-4 landscape:items-center landscape:justify-end landscape:col-start-2 landscape:row-start-1 landscape:row-span-2 landscape:px-4 lg:landscape:px-8",
    entryBottomRow: "flex-none w-full landscape:col-start-1 landscape:col-end-3 landscape:row-start-3",
} as const;

