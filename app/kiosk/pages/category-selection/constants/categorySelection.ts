import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { categorySelectionTexts } from "./categorySelectionTexts";

/**
 * Theme colours for the Adult / Pedia category buttons.
 *
 * Imports from the global `themeColors` palette so hex values
 * are never duplicated.
 */
export const categorySelectionTheme = {
    adultColor: themeColors.brandRed,
    pediaColor: themeColors.skyBlue,
    /** Fill colour for the Tabler icons inside the cards. */
    iconFill: themeColors.white,
} as const;
