/**
 * @file kioskBackButton.ts
 * @description Centralized visual styles and Tailwind utility classes for the universal kiosk back navigation button.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/**
 * Static visual style definitions for the universal kiosk back navigation button.
 */
export const KioskBackButtonStyles = {
    /**
     * Button container visual styling including brand red background.
     */
    button: {
        backgroundColor: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Tailwind utility class names for the universal kiosk back navigation button.
 */
export const KioskBackButtonClasses = {
    /**
     * Tactile elevated pill button with touch-optimized scaling and hover feedback.
     */
    button: "absolute left-6 top-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xl sm:text-2xl font-bold text-white shadow-md transition-all duration-150 active:scale-95 hover:brightness-105",
} as const;
