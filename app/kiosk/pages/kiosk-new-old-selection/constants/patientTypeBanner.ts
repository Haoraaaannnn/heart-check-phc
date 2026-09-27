/**
 * @file patientTypeBanner.ts
 * @description Centralized visual styles for `PatientTypeBanner`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Typography tokens for patient type banner. */
export const patientTypeBannerTypography = {
    bannerTitleSize: "clamp(24px, 2.5vw, 40px)",
    bannerSubtitleSize: "clamp(18px, 1.8vw, 30px)",
} as const;

/** Inline styles for `PatientTypeBanner`. */
export const PatientTypeBannerStyle = {
    container: {
        width: "100%",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: "clamp(24px, 3vh, 40px)",
        textAlign: "center",
    },
    title: {
        fontSize: patientTypeBannerTypography.bannerTitleSize,
        fontWeight: 900,
        lineHeight: 1.25,
        color: themeColors.black,
        margin: 0,
    },
    subtitle: {
        marginTop: 12,
        fontSize: patientTypeBannerTypography.bannerSubtitleSize,
        fontWeight: 400,
        lineHeight: 1.25,
        color: "#1F2937",
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
