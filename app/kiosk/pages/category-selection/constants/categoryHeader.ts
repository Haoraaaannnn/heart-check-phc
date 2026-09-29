/**
 * @file categoryHeader.ts
 * @description Centralized visual styles for the category selection header.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for the category selection header, referencing centralized root typography scale. */
export const categoryHeaderTypography = {
    titleSize: kioskTypography.pageTitle,
    subtitleSize: kioskTypography.pageSubtitle,
    titleWeight: 900,
    subtitleWeight: 500,
} as const;

/** Inline styles for `CategorySelectionPage` header. */
export const CategoryHeaderStyle = {
    header: {
        textAlign: "center",
        width: "100%",
    },
    title: {
        fontSize: categoryHeaderTypography.titleSize,
        fontWeight: categoryHeaderTypography.titleWeight,
        color: themeColors.black,
        lineHeight: 1.2,
        margin: 0,
    },
    subtitle: {
        marginTop: 8,
        fontSize: categoryHeaderTypography.subtitleSize,
        fontWeight: categoryHeaderTypography.subtitleWeight,
        color: "#4B5563",
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
