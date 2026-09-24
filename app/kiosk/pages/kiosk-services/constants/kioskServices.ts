import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Spacing tokens for the services menu cards and grid. */
export const kioskServicesSpacing = {
    cardGap: 16,
    cardPaddingX: 24,
    cardPaddingY: 16,
    cardHeight: 164,
    iconTileSize: 88,
    iconTilePadding: 16,
    gridGap: 24,
    gridPaddingX: 32,
    gridPaddingY: 24,
} as const;

/** Color tokens for the services cards. */
export const kioskServicesColors = {
    iconTileBg: themeColors.brandRed,
    iconFill: themeColors.white,
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB", // gray-300
    pillBg: "rgba(252, 165, 165, 0.2)",
    pillBorder: "rgba(239, 68, 68, 0.35)",
    pillText: themeColors.black,
    titleText: themeColors.black,
    arrowColor: "#D7D6D6",
} as const;

/** Typography tokens for service cards. */
export const kioskServicesTypography = {
    titleSize: "clamp(22px, 1.6vw, 30px)",
    pillSize: "clamp(16px, 1.1vw, 20px)",
} as const;

/** Inline styles for `ServiceCard`. */
export const KioskServicesCardStyle = {
    card: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        minHeight: kioskServicesSpacing.cardHeight,
        gap: kioskServicesSpacing.cardGap,
        paddingLeft: kioskServicesSpacing.cardPaddingX,
        paddingRight: kioskServicesSpacing.cardPaddingX,
        paddingTop: kioskServicesSpacing.cardPaddingY,
        paddingBottom: kioskServicesSpacing.cardPaddingY,
        borderRadius: 16,
        backgroundColor: kioskServicesColors.cardBg,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: kioskServicesColors.cardBorder,
        textAlign: "left",
        overflow: "hidden",
        cursor: "pointer",
    },
    iconTile: {
        width: kioskServicesSpacing.iconTileSize,
        height: kioskServicesSpacing.iconTileSize,
        flexShrink: 0,
        backgroundColor: kioskServicesColors.iconTileBg,
        padding: kioskServicesSpacing.iconTilePadding,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    labelWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        paddingLeft: 8,
        color: kioskServicesColors.titleText,
    },
    title: {
        fontWeight: 900,
        fontSize: kioskServicesTypography.titleSize,
        lineHeight: 1.2,
    },
    pill: {
        width: "fit-content",
        display: "inline-block",
        backgroundColor: kioskServicesColors.pillBg,
        border: `1px solid ${kioskServicesColors.pillBorder}`,
        color: kioskServicesColors.pillText,
        fontSize: kioskServicesTypography.pillSize,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        marginTop: 4,
        lineHeight: 1.2,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `KioskServicesGrid`. */
export const KioskServicesGridStyle = {
    container: {
        width: "100%",
    },
    grid: {
        display: "grid",
        width: "100%",
        gap: kioskServicesSpacing.gridGap,
        paddingLeft: kioskServicesSpacing.gridPaddingX,
        paddingRight: kioskServicesSpacing.gridPaddingX,
        paddingTop: kioskServicesSpacing.gridPaddingY,
        paddingBottom: kioskServicesSpacing.gridPaddingY,
    },
} satisfies Record<string, CSSProperties>;
