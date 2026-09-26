import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { fontSizeHeader } from "@/constants/kiosk";

// Re-export text copy for backward compatibility
export { cubicleSelectionTexts } from "./cubicleSelectionTexts";

/**
 * Spacing values for cubicle selection components.
 */
export const cubicleSelectionSpacing = {
    headerPaddingX: 24,
    headerPaddingBottom: "clamp(24px, 3vh, 40px)",
    headerSubtitleMarginTop: 12,
    cardGap: 16,
    cardPaddingX: "clamp(18px, 2.5vw, 28px)",
    cardPaddingY: 16,
    iconTilePadding: "clamp(10px, 1.2vw, 16px)",
    gridGap: 24,
    gridPadding: 24,
} as const;

/**
 * Typography tokens for cubicle selection.
 */
export const cubicleSelectionTypography = {
    titleSize: "clamp(24px, 2.5vw, 40px)",
    subtitleSize: "clamp(18px, 1.8vw, 28px)",
    cardTitleSize: "clamp(20px, 2vw, 28px)",
} as const;

/**
 * Font weight tokens for cubicle selection.
 */
export const cubicleSelectionFontWeight = {
    normal: 400,
    bold: 700,
    black: 900,
} as const;

/**
 * Color tokens for cubicle selection.
 */
export const cubicleSelectionColors = {
    primaryText: themeColors.black,
    subtitleText: "#1F2937", // gray-800
    cardTitleText: "#111827", // gray-900
    iconTileBg: themeColors.brandRed,
    iconFill: themeColors.white,
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB", // gray-300
    arrowColor: "#D7D6D6",
} as const;

/**
 * Inline styles for `CubicleHeader`, composed from the tokens above.
 */
export const CubicleHeaderStyle = {
    container: {
        width: "100%",
        paddingLeft: cubicleSelectionSpacing.headerPaddingX,
        paddingRight: cubicleSelectionSpacing.headerPaddingX,
        paddingBottom: cubicleSelectionSpacing.headerPaddingBottom,
        textAlign: "center",
    },
    title: {
        fontSize: cubicleSelectionTypography.titleSize,
        fontWeight: cubicleSelectionFontWeight.black,
        lineHeight: 1.25,
        color: cubicleSelectionColors.primaryText,
        margin: 0,
    },
    subtitle: {
        marginTop: cubicleSelectionSpacing.headerSubtitleMarginTop,
        fontSize: cubicleSelectionTypography.subtitleSize,
        fontWeight: cubicleSelectionFontWeight.normal,
        lineHeight: 1.25,
        color: cubicleSelectionColors.subtitleText,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Inline styles for `CubicleCard`, composed from the tokens above.
 */
export const CubicleCardStyle = {
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: cubicleSelectionSpacing.cardGap,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: cubicleSelectionColors.cardBorder,
        backgroundColor: cubicleSelectionColors.cardBg,
        paddingLeft: cubicleSelectionSpacing.cardPaddingX,
        paddingRight: cubicleSelectionSpacing.cardPaddingX,
        paddingTop: cubicleSelectionSpacing.cardPaddingY,
        paddingBottom: cubicleSelectionSpacing.cardPaddingY,
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
        padding: cubicleSelectionSpacing.iconTilePadding,
        backgroundColor: cubicleSelectionColors.iconTileBg,
    },
    titleWrapper: {
        position: "relative",
        zIndex: 10,
        display: "flex",
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        paddingLeft: 8,
    },
    title: {
        fontWeight: cubicleSelectionFontWeight.black,
        fontSize: cubicleSelectionTypography.cardTitleSize,
        lineHeight: 1.2,
        color: cubicleSelectionColors.cardTitleText,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
} satisfies Record<string, CSSProperties>;

/** Legacy export for backward compatibility */
export const cubicleSelectionStyles = {
    cardIconWrapper: {
        backgroundColor: cubicleSelectionColors.iconTileBg,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Tailwind CSS class name dictionary for cubicle selection components.
 *
 * Centralizes layout grids, card interactions, and layout wrapper classes
 * so that consumer UI components avoid hardcoded utility strings.
 */
export const CubicleSelectionClasses = {
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 landscape:grid-cols-3 gap-6 px-6 py-6",
    card: "group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-md",
    cardIconWrapper: "transition-transform group-hover:scale-105",
    cardArrow: "shrink-0 transition-transform group-hover:translate-x-1",
    layoutOverlay: (mounted: boolean): string =>
        `flex h-full w-full items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutContainer: "relative flex h-full w-full flex-col overflow-hidden",
    layoutMain: (isLandscape: boolean): string =>
        `flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isLandscape ? "pb-[120px]" : "pb-[140px]"
        }`,
    layoutInner: (isLandscape: boolean): string =>
        `m-auto flex flex-col items-center ${
            isLandscape ? "w-[92%] max-w-[1600px]" : "w-full max-w-[900px]"
        }`,
    layoutChildren: "w-full",
} as const;

