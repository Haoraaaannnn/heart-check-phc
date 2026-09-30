/**
 * @file kioskBackButton.ts
 * @description Centralized visual styles and Tailwind utility classes for the universal kiosk back navigation button.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";

/**
 * Icon tokens for the universal kiosk back navigation button.
 */
export const KioskBackButtonTokens = {
    /** Boxicons class for the left-pointing navigation arrow. */
    iconClass: COMMON_ICONS.back,
} as const;

/**
 * Static visual style definitions for the universal kiosk back navigation button.
 */
export const KioskBackButtonStyles = {
    /**
     * Button container visual styling with white background, brand red text and border.
     */
    button: {
        backgroundColor: themeColors.white,
        color: themeColors.brandRed,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#D1D5DB",
        paddingTop: "clamp(12px, 1.4vh, 18px)",
        paddingBottom: "clamp(12px, 1.4vh, 18px)",
        paddingLeft: "clamp(16px, 2vw, 26px)",
        paddingRight: "clamp(16px, 2vw, 26px)",
        whiteSpace: "nowrap",
    },
    /**
     * Inline icon sizing ensuring faithful rendering identical to previous Tabler icons.
     */
    icon: {
        fontSize: "clamp(24px, 2.4vw, 32px)",
        lineHeight: 1,
        color: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Tailwind utility class names for the universal kiosk back navigation button.
 */
export const KioskBackButtonClasses = {
    /**
     * In-flow elevated pill button with touch-optimized scaling (non-overflowing).
     */
    button: "inline-flex items-center gap-2 sm:gap-2.5 rounded-2xl text-base sm:text-2xl font-bold shadow-sm transition-all duration-150 active:scale-95 active:!border-[#ED1C24] active:bg-gray-50",
} as const;
