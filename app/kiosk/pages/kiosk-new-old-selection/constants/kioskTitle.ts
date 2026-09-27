/**
 * @file kioskTitle.ts
 * @description Centralized visual styles and Tailwind utility classes for `KioskTitle`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Typography tokens for kiosk title. */
export const kioskTitleTypography = {
    titleSize: "clamp(32px, 3.5vw, 54px)",
} as const;

/** Inline styles for `KioskTitle`. */
export const KioskTitleStyle = {
    container: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
    },
    titleWrapper: {
        textAlign: "center",
    },
    title: {
        fontWeight: 900,
        fontSize: kioskTitleTypography.titleSize,
        color: "#1F2937",
        lineHeight: 1.2,
    },
    titleAccent: {
        color: themeColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `KioskTitle`. */
export const KioskTitleClasses = {
    titleStroke: "[-webkit-text-stroke:1px_currentColor]",
    titleImageWrapper: (isLandscape: boolean): string =>
        `relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm ${
            isLandscape ? "max-w-[760px]" : "max-w-[900px]"
        }`,
    titleImage: "object-cover",
} as const;
