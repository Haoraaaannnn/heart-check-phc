import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { cubicleSelectionTexts } from "./cubicleSelectionTexts";

/** Typography tokens for cubicle selection. */
export const cubicleSelectionTypography = {
    titleSize: "clamp(24px, 2.5vw, 40px)",
    subtitleSize: "clamp(18px, 1.8vw, 30px)",
    cardTitleSize: "clamp(22px, 2vw, 30px)",
} as const;

/** Styling tokens for cubicle selection. */
export const cubicleSelectionStyles = {
    cardIconWrapper: {
        backgroundColor: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;
