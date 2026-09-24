import { themeColors } from "@/constants/colors";

/** Max phone number digits for PH mobile format (e.g. 09XXXXXXXXX). */
export const SMS_PHONE_MAX_LENGTH = 11;

/** Default placeholder phone number. */
export const SMS_PHONE_PLACEHOLDER = "0912 345 6780";

// Re-export text copy for backward compatibility
export { smsInputTexts } from "./smsInputTexts";

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
};
