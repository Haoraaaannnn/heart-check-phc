import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { kioskNewOldTexts } from "./kioskNewOldTexts";

/** Typography tokens for the new/old patient category selection screen. */
export const kioskNewOldTypography = {
    titleSize: "clamp(32px, 3.5vw, 54px)",
    bannerTitleSize: "clamp(24px, 2.5vw, 40px)",
    bannerSubtitleSize: "clamp(18px, 1.8vw, 30px)",
    cardTitleSize: "clamp(22px, 2vw, 30px)",
    cardBadgeSize: "clamp(15px, 1.3vw, 20px)",
} as const;

/** Spacing tokens for the new/old patient category selection screen. */
export const kioskNewOldSpacing = {
    containerGap: "clamp(20px, 4vw, 60px)",
    contentMaxWidth: "1750px",
} as const;

/** Style tokens for the new/old patient category selection screen. */
export const kioskNewOldStyles = {
    titleAccent: {
        color: themeColors.brandRed,
    },
    cardIconWrapper: {
        backgroundColor: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;
