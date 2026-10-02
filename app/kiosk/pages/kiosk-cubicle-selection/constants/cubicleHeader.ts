/**
 * @file cubicleHeader.ts
 * @description Centralized visual styles for `CubicleHeader`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Spacing values for cubicle header. */
export const cubicleHeaderSpacing = {
    headerPaddingX: 0,
    headerPaddingBottom: 0,
    headerSubtitleMarginTop: 4,
} as const;

/** Typography tokens for cubicle header, referencing centralized root typography scale. */
export const cubicleHeaderTypography = {
    titleSize: kioskTypography.pageTitle,
    subtitleSize: kioskTypography.pageSubtitle,
    titleWeight: 900,
    subtitleWeight: 500,
} as const;

/** Inline styles for `CubicleHeader`. */
export const CubicleHeaderStyle = {
    container: {
        width: "100%",
        textAlign: "center",
        paddingBottom: 0,
        marginBottom: 0,
    },
    title: {
        fontSize: cubicleHeaderTypography.titleSize,
        fontWeight: cubicleHeaderTypography.titleWeight,
        lineHeight: 1.2,
        color: themeColors.black,
        margin: 0,
    },
    subtitle: {
        margin: 0,
        marginTop: cubicleHeaderSpacing.headerSubtitleMarginTop,
        marginBottom: 0,
        fontSize: cubicleHeaderTypography.subtitleSize,
        fontWeight: cubicleHeaderTypography.subtitleWeight,
        lineHeight: 1.25,
        color: "#4B5563",
    },
} satisfies Record<string, CSSProperties>;
