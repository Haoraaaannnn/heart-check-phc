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
    cardGap: "clamp(12px, 1.6vw, 18px)",
    cardPaddingX: "clamp(16px, 2vw, 26px)",
    cardPaddingY: "clamp(16px, 1.8vh, 22px)",
    cardMinHeight: "clamp(135px, 14vh, 170px)",
    iconTileSize: 88,
    iconTilePadding: 16,
    gridGap: "clamp(16px, 2vw, 24px)",
    gridPaddingX: "clamp(16px, 2.5vw, 32px)",
    gridPaddingY: "clamp(16px, 2vh, 24px)",
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
        fontSize: "clamp(48px, 5.2vw, 76px)",
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: "clamp(26px, 2.6vw, 36px)",
        color: kioskServicesColors.arrowColor,
        lineHeight: 1,
    },
    card: {
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        minHeight: kioskServicesSpacing.cardMinHeight,
        alignItems: "center",
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
        boxSizing: "border-box",
    },
    iconWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: "clamp(52px, 5.2vw, 76px)",
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
        paddingLeft: "clamp(4px, 0.8vw, 8px)",
        color: kioskServicesColors.titleText,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },
    title: {
        fontWeight: 900,
        fontSize: kioskServicesTypography.titleSize,
        lineHeight: 1.2,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
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
        lineHeight: 1.25,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
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

/** Spacing tokens for kiosk services page layout. */
export const kioskServicesLayoutSpacing = {
    containerPaddingX: 24,
} as const;

/** Inline layout styles for kiosk services, matching the category-selection pattern. */
export const KioskServicesLayoutStyle = {
    container: {
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    headerWrapper: {
        width: "100%",
        flexShrink: 0,
        paddingTop: 0,
        paddingBottom: 4,
        paddingLeft: kioskServicesLayoutSpacing.containerPaddingX,
        paddingRight: kioskServicesLayoutSpacing.containerPaddingX,
    },
    contentWrapper: {
        display: "flex",
        width: "100%",
        maxWidth: "1300px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "auto",
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `KioskServicesGrid`. */
export const KioskServicesGridStyle = {
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    grid: {
        display: "grid",
        width: "100%",
        gap: kioskServicesSpacing.gridGap,
        paddingLeft: kioskServicesSpacing.gridPaddingX,
        paddingRight: kioskServicesSpacing.gridPaddingX,
        paddingTop: 4,
        paddingBottom: kioskServicesSpacing.gridPaddingY,
        gridAutoRows: "1fr",
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
    grid: "grid w-full grid-cols-2 landscape:grid-cols-3 gap-3 sm:gap-6 px-4 pt-1 pb-2 auto-rows-fr",
    container: "relative flex h-full w-full flex-col overflow-hidden bg-transparent justify-center items-center py-2 sm:py-4",
    headerWrapper: "w-full shrink-0 pt-0 pb-1 px-4 flex flex-col items-center justify-center",
    contentWrapper: "m-auto flex w-full max-w-[960px] landscape:max-w-[1300px] flex-col items-center justify-center px-2 sm:px-4",
    layoutOverlay: (mounted: boolean): string =>
        `flex h-full w-full items-center justify-center overflow-hidden bg-transparent transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutContainer: "relative flex h-full w-full flex-col overflow-hidden items-center justify-center",
    bannerWrapper: "w-full shrink-0 pt-0 pb-0 px-4 flex flex-col items-center justify-center",
    cardsScrollArea: (_isLandscape: boolean): string =>
        "h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center justify-center py-2 sm:py-3 px-2",
    layoutMain: (_isLandscape: boolean): string =>
        "h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center justify-center py-2 sm:py-3 px-2",
    layoutInner: (isLandscape: boolean): string =>
        `m-auto flex flex-col items-center justify-center ${
            isLandscape ? "w-[92%] max-w-[1600px]" : "w-[96%] max-w-[1100px]"
        }`,
    layoutChildren: "w-full flex flex-col items-center justify-center",
} as const;

