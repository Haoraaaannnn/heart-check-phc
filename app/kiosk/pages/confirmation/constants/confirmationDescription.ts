/**
 * @file confirmationDescription.ts
 * @description Centralized visual styles for `ConfimationDescription`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Spacing tokens for description. */
export const confirmationDescriptionSpacing = {
    gap: 16,
    borderRadius: 16,
} as const;

/** Typography tokens for description. */
export const confirmationDescriptionTypography = {
    descBadgeSize: "clamp(14px, 1.4vw, 18px)",
    descTextSize: "clamp(16px, 1.6vw, 22px)",
} as const;

/** Inline styles for `ConfimationDescription`. */
export const ConfirmationDescriptionStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: confirmationDescriptionSpacing.gap,
        width: "100%",
        padding: "clamp(20px, 3vw, 24px)",
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        borderRadius: 16,
        backgroundColor: themeColors.white,
        boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
    },
    badge: {
        width: "fit-content",
        backgroundColor: themeColors.brandRed,
        color: themeColors.white,
        fontSize: confirmationDescriptionTypography.descBadgeSize,
        fontWeight: 700,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    text: {
        fontSize: confirmationDescriptionTypography.descTextSize,
        color: "#1F2937",
        lineHeight: 1.6,
    },
    textFil: {
        fontSize: confirmationDescriptionTypography.descTextSize,
        color: "#1F2937",
        lineHeight: 1.6,
        marginTop: 4,
        textAlign: "left",
        fontWeight: 900,
    },
    textEn: {
        fontSize: confirmationDescriptionTypography.descTextSize,
        color: "#4B5563",
        lineHeight: 1.6,
        textAlign: "left",
        fontWeight: 500,
    },
    divider: {
        height: 2,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        marginTop: 4,
        marginBottom: 4,
    },
} satisfies Record<string, CSSProperties>;
