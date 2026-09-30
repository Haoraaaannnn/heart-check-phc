/**
 * @file kioskTitle.ts
 * @description Centralized visual styles and Tailwind utility classes for `KioskTitle`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for kiosk title, referencing centralized root typography scale. */
export const kioskTitleTypography = {
    titleSize: kioskTypography.heroTitle,
} as const;

/** Inline styles for `KioskTitle`. */
export const KioskTitleStyle = {
    container: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(6px, 1.2vh, 16px)",
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
            isLandscape ? "max-w-[760px]" : "max-w-[480px] max-h-[18vh] sm:max-h-[22vh]"
        }`,
    titleImage: "object-cover",
} as const;
