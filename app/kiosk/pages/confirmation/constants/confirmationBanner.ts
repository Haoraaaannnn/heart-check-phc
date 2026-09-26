/**
 * @file confirmationBanner.ts
 * @description Centralized visual styles and class names for `ConfirmationBanner`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Spacing tokens for banner. */
export const confirmationBannerSpacing = {
    paddingX: "clamp(16px, 2vw, 24px)",
    paddingY: "clamp(20px, 2.5vh, 32px)",
} as const;

/** Typography tokens for banner. */
export const confirmationBannerTypography = {
    bannerTitleSize: "clamp(24px, 3vw, 42px)",
    bannerBadgeSize: "clamp(16px, 1.6vw, 24px)",
} as const;

/** Colors for banner. */
export const confirmationBannerColors = {
    brandRed: themeColors.brandRed,
    white: themeColors.white,
    pillBg: "rgba(255, 255, 255, 0.2)",
    pillBorder: "rgba(255, 255, 255, 0.35)",
} as const;

/** Inline styles for `ConfirmationBanner`. */
export const ConfirmationBannerStyle = {
    banner: {
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: confirmationBannerSpacing.paddingX,
        paddingRight: confirmationBannerSpacing.paddingX,
        paddingTop: confirmationBannerSpacing.paddingY,
        paddingBottom: confirmationBannerSpacing.paddingY,
        overflow: "hidden",
        color: confirmationBannerColors.white,
        backgroundColor: confirmationBannerColors.brandRed,
    },
    textWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        padding: confirmationBannerSpacing.paddingX,
        minWidth: 0,
    },
    title: {
        fontWeight: 900,
        fontSize: confirmationBannerTypography.bannerTitleSize,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    badge: {
        marginTop: 8,
        width: "fit-content",
        display: "inline-block",
        backgroundColor: confirmationBannerColors.pillBg,
        border: `1px solid ${confirmationBannerColors.pillBorder}`,
        color: confirmationBannerColors.white,
        fontSize: confirmationBannerTypography.bannerBadgeSize,
        fontWeight: 700,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        lineHeight: 1,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind class names for `ConfirmationBanner`. */
export const ConfirmationBannerClasses = {
    icon: "absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none select-none text-white",
} as const;
