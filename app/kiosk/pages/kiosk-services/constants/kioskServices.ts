import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";
import { kioskTypography } from "@/constants/kiosk";

/** Boxicons class tokens for services menu elements. */
export const KioskServicesIcons = {
    arrow: COMMON_ICONS.arrowRight,
    fallback: COMMON_ICONS.fallback,
} as const;

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
    cardBg: themeColors.white,
    cardBorder: "#D1D5DB", // gray-300
    pillBg: "rgba(252, 165, 165, 0.2)",
    pillBorder: "rgba(239, 68, 68, 0.35)",
    pillText: themeColors.black,
    titleText: themeColors.black,
    subtitleText: "#4B5563",
    arrowColor: "#D7D6D6",
} as const;

/** Typography tokens for service cards, referencing centralized root typography scale. */
export const kioskServicesTypography = {
    titleSize: kioskTypography.cardTitle,
    subtitleSize: kioskTypography.cardSubtitle,
    pillSize: kioskTypography.badgeLarge,
} as const;

/** Inline styles for `ServiceCard`. */
export const KioskServicesCardStyle = {
    icon: {
        fontSize: 76,
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: 36,
        color: kioskServicesColors.arrowColor,
        lineHeight: 1,
    },
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
    iconWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    iconTile: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
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
    divider: {
        height: 2,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        marginTop: 6,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: kioskServicesTypography.subtitleSize,
        fontWeight: 600,
        color: kioskServicesColors.subtitleText,
        lineHeight: 1.3,
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

/**
 * Tailwind CSS class name dictionary for kiosk services components.
 *
 * Centralizes interactive pseudo-classes, transitions, grid templates,
 * and layout utility classes so that component files avoid hardcoding raw utility strings.
 */
export const KioskServicesClasses = {
    card: "group transition-all duration-100 active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm",
    cardIconWrapper: "shrink-0",
    cardArrow: "shrink-0 transition-all duration-100 text-[#D7D6D6] group-active:!text-[#ED1C24] group-active:translate-x-1",
    grid: "grid-cols-2 landscape:grid-cols-3",
    layoutOverlay: (mounted: boolean): string =>
        `fixed inset-0 flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutContainer: "relative flex h-full w-full flex-col overflow-hidden",
    layoutMain: (isLandscape: boolean): string =>
        `flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isLandscape ? "pb-[120px]" : "pb-[140px]"
        }`,
    layoutInner: (isLandscape: boolean): string =>
        `m-auto flex flex-col items-center ${
            isLandscape ? "w-[92%] max-w-[1600px]" : "w-full"
        }`,
    layoutChildren: "w-full",
} as const;

