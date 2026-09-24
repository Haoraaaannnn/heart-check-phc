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
    cardBadgeSize: "clamp(13px, 1.2vw, 18px)",
} as const;

/** Spacing tokens for the new/old patient category selection screen. */
export const kioskNewOldSpacing = {
    containerGap: "clamp(20px, 4vw, 60px)",
    contentMaxWidth: "1750px",
    headerPaddingX: 24,
    headerPaddingBottom: "clamp(24px, 3vh, 40px)",
    headerSubtitleMarginTop: 12,
    cardGap: 16,
    cardPaddingX: "clamp(20px, 2.5vw, 32px)",
    cardPaddingY: 20,
    iconTilePadding: 12,
} as const;

/** Colors for the new/old patient category selection screen. */
export const kioskNewOldColors = {
    primaryText: themeColors.black,
    subtitleText: "#1F2937", // gray-800
    cardTitleText: "#111827", // gray-900
    brandRed: themeColors.brandRed,
    white: themeColors.white,
    cardBorder: "#D1D5DB", // gray-300
    cardBadgeBg: "rgba(254, 226, 226, 0.7)",
    cardBadgeBorder: "rgba(252, 165, 165, 0.6)",
    cardBadgeText: "#450a0a",
    arrowColor: "#D7D6D6",
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
        fontSize: kioskNewOldTypography.titleSize,
        color: "#1F2937",
        lineHeight: 1.2,
    },
    titleAccent: {
        color: kioskNewOldColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `PatientTypeBanner`. */
export const PatientTypeBannerStyle = {
    container: {
        width: "100%",
        paddingLeft: kioskNewOldSpacing.headerPaddingX,
        paddingRight: kioskNewOldSpacing.headerPaddingX,
        paddingBottom: kioskNewOldSpacing.headerPaddingBottom,
        textAlign: "center",
    },
    title: {
        fontSize: kioskNewOldTypography.bannerTitleSize,
        fontWeight: 900,
        lineHeight: 1.25,
        color: kioskNewOldColors.primaryText,
        margin: 0,
    },
    subtitle: {
        marginTop: kioskNewOldSpacing.headerSubtitleMarginTop,
        fontSize: kioskNewOldTypography.bannerSubtitleSize,
        fontWeight: 400,
        lineHeight: 1.25,
        color: kioskNewOldColors.subtitleText,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `PatientTypeCard`. */
export const PatientTypeCardStyle = {
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: kioskNewOldSpacing.cardGap,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: kioskNewOldColors.cardBorder,
        backgroundColor: kioskNewOldColors.white,
        paddingLeft: kioskNewOldSpacing.cardPaddingX,
        paddingRight: kioskNewOldSpacing.cardPaddingX,
        paddingTop: kioskNewOldSpacing.cardPaddingY,
        paddingBottom: kioskNewOldSpacing.cardPaddingY,
        textAlign: "left",
        overflow: "hidden",
        cursor: "pointer",
    },
    iconWrapper: {
        flexShrink: 0,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: kioskNewOldSpacing.iconTilePadding,
        backgroundColor: kioskNewOldColors.brandRed,
    },
    labelsWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minWidth: 0,
        paddingLeft: 8,
    },
    cardTitle: {
        fontWeight: 900,
        fontSize: kioskNewOldTypography.cardTitleSize,
        lineHeight: 1.2,
        color: kioskNewOldColors.cardTitleText,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    cardBadge: {
        marginTop: 6,
        width: "fit-content",
        display: "inline-block",
        backgroundColor: kioskNewOldColors.cardBadgeBg,
        border: `1px solid ${kioskNewOldColors.cardBadgeBorder}`,
        color: kioskNewOldColors.cardBadgeText,
        fontWeight: 700,
        fontSize: kioskNewOldTypography.cardBadgeSize,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        lineHeight: 1,
    },
} satisfies Record<string, CSSProperties>;

/** Legacy export for backward compatibility */
export const kioskNewOldStyles = {
    titleAccent: {
        color: kioskNewOldColors.brandRed,
    },
    cardIconWrapper: {
        backgroundColor: kioskNewOldColors.brandRed,
    },
} satisfies Record<string, CSSProperties>;
