import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { confirmationTexts } from "./confirmationTexts";

/** Styling tokens for service confirmation elements. */
export const confirmationStyles = {
    headerBg: {
        backgroundColor: themeColors.brandRed,
    },
    badgeBg: {
        backgroundColor: themeColors.brandRed,
    },
    continueBtnBg: {
        backgroundColor: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;
