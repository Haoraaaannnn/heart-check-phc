/**
 * @file smsBanner.ts
 * @description Centralized visual styles for the top service summary banner in the SMS input screen.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Inline styles for `SMSBanner`. */
export const SMSBannerStyle = {
    banner: {
        position: "relative",
        zIndex: 10,
        width: "100%",
        paddingLeft: "clamp(16px, 2vw, 32px)",
        paddingRight: "clamp(16px, 2vw, 32px)",
        paddingTop: "clamp(12px, 1.5vh, 16px)",
        paddingBottom: "clamp(12px, 1.5vh, 16px)",
        color: themeColors.white,
        backgroundColor: themeColors.brandRed,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    content: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    },
    labelFil: {
        fontWeight: 900,
        fontSize: "clamp(24px, 2.5vw, 36px)",
        lineHeight: 1.2,
        marginBottom: 4,
        color: themeColors.white,
    },
    labelEn: {
        width: "fit-content",
        display: "inline-block",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.35)",
        color: themeColors.white,
        fontSize: "clamp(12px, 1.2vw, 16px)",
        fontWeight: 700,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 9999,
    },
} satisfies Record<string, CSSProperties>;
