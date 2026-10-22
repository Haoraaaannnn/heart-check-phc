/**
 * @file kioskLoadingOverlay.ts
 * @description Centralized visual styles and Tailwind utility classes for the full-screen kiosk loading overlay.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/**
 * Static visual style definitions for the full-screen kiosk loading overlay.
 */
export const KioskLoadingOverlayStyles = {
    /**
     * Modal-level fixed overlay backdrop styling.
     */
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
    },

    /**
     * Activity spinner dimensions and brand red top border.
     */
    spinner: {
        height: "4rem",
        width: "4rem",
        borderTopColor: themeColors.brandRed,
    },

    /**
     * Accompanying status message text styling.
     */
    message: {
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Tailwind utility class names for the full-screen kiosk loading overlay.
 */
export const KioskLoadingOverlayClasses = {
    /**
     * High-visibility blur backdrop covering the active screen.
     */
    overlay: "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-sm",

    /**
     * Animated circular loading spinner with PHC brand red active top border.
     */
    spinner: "h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-[#a8071a]",

    /**
     * Medium-weight status text with subtle drop shadow for readability.
     */
    message: "text-lg font-medium text-slate-800 drop-shadow-sm",
} as const;
