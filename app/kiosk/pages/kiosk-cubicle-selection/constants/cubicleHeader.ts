/**
 * @file cubicleHeader.ts
 * @description Centralized visual styles for `CubicleHeader`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Spacing values for cubicle header. */
export const cubicleHeaderSpacing = {
    headerPaddingX: 24,
    headerPaddingBottom: "clamp(24px, 3vh, 40px)",
    headerSubtitleMarginTop: 12,
} as const;

/** Typography tokens for cubicle header, referencing centralized root typography scale. */
export const cubicleHeaderTypography = {
    titleSize: kioskTypography.pageTitle,
    subtitleSize: kioskTypography.pageSubtitle,
} as const;

/** Inline styles for `CubicleHeader`. */
export const CubicleHeaderStyle = {
    container: {
        width: "100%",
        paddingLeft: cubicleHeaderSpacing.headerPaddingX,
        paddingRight: cubicleHeaderSpacing.headerPaddingX,
        paddingBottom: cubicleHeaderSpacing.headerPaddingBottom,
        textAlign: "center",
    },
    title: {
        fontSize: cubicleHeaderTypography.titleSize,
        fontWeight: 900,
        lineHeight: 1.25,
        color: themeColors.black,
        margin: 0,
    },
    subtitle: {
        marginTop: cubicleHeaderSpacing.headerSubtitleMarginTop,
        fontSize: cubicleHeaderTypography.subtitleSize,
        fontWeight: 400,
        lineHeight: 1.25,
        color: "#1F2937",
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
