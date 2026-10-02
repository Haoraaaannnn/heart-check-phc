import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { COMMON_ICONS } from "@/constants/icons";
import { kioskTypography } from "@/constants/kiosk";

/** Boxicons class tokens for services menu elements. */
export const KioskServicesIcons = {
    arrow: COMMON_ICONS.arrowRight,
    fallback: COMMON_ICONS.fallback,
    chevronDown: COMMON_ICONS.chevronDown,
} as const;

/** Spacing tokens for the services menu cards and grid, widened for enhanced touch accessibility. */
export const kioskServicesSpacing = {
    cardGap: "clamp(14px, 1.8vmin, 22px)",
    cardPaddingX: "clamp(20px, 2.6vmin, 36px)",
    cardPaddingY: "clamp(16px, 1.8vh, 24px)",
    cardMinHeight: "clamp(125px, 13.5vh, 165px)",
    iconTileSize: 88,
    iconTilePadding: 16,
    gridGap: "clamp(16px, 2.2vmin, 28px)",
    gridPaddingX: "clamp(12px, 1.5vmin, 24px)",
    gridPaddingY: "clamp(12px, 1.5vh, 20px)",
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
        fontSize: "clamp(48px, 5.2vmin, 76px)",
        color: themeColors.brandRed,
        lineHeight: 1,
    },
    arrowIcon: {
        fontSize: "clamp(26px, 2.6vmin, 36px)",
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
        width: "clamp(52px, 5.2vmin, 76px)",
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
        paddingLeft: "clamp(6px, 1vmin, 12px)",
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

/** Inline layout styles for kiosk services, matching the single-container layout pattern with sticky header and scrollable buttons. */
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
        paddingBottom: 0,
        paddingLeft: kioskServicesLayoutSpacing.containerPaddingX,
        paddingRight: kioskServicesLayoutSpacing.containerPaddingX,
        position: "sticky",
        top: 0,
        zIndex: 10,
    },
    contentWrapper: {
        display: "flex",
        maxHeight: "100%",
        width: "95%",
        maxWidth: "1650px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        margin: "auto",
    },
    scrollWrapper: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        flex: "0 1 auto",
        maxHeight: "100%",
        minHeight: 0,
        overflow: "hidden",
    },
    cardsScrollArea: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
    },
    scrollTopShadow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 24,
        background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), transparent)",
        pointerEvents: "none",
        zIndex: 15,
    },
    scrollBottomShadow: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        background: "linear-gradient(to top, rgba(255, 255, 255, 0.95), transparent)",
        pointerEvents: "none",
        zIndex: 15,
    },
    scrollIndicator: {
        position: "absolute",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingLeft: 20,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: 9999,
        backgroundColor: themeColors.white,
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor: themeColors.brandRed,
        boxShadow: "0 4px 16px rgba(237, 28, 36, 0.18)",
        color: themeColors.brandRed,
        cursor: "pointer",
        zIndex: 25,
        transition: "all 0.2s ease-in-out",
    },
    scrollIndicatorText: {
        fontSize: kioskTypography.badgeMedium,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
    },
    scrollIndicatorIcon: {
        fontSize: 20,
        lineHeight: 1,
        color: themeColors.brandRed,
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
        paddingTop: 2,
        paddingBottom: "clamp(36px, 5vh, 60px)",
        gridAutoRows: "1fr",
        margin: "0 auto",
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
    grid: "grid w-full grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 xl:landscape:grid-cols-3 gap-4 sm:gap-6 px-3 sm:px-6 pt-1 pb-10 mx-auto auto-rows-fr",
    container: "relative flex h-full w-full flex-col overflow-hidden bg-transparent justify-center items-center py-1 sm:py-2",
    headerWrapper: "w-full shrink-0 pt-0 pb-0 px-4 flex flex-col items-center justify-center sticky top-0 z-10 bg-transparent",
    contentWrapper: "m-auto flex max-h-full w-[95%] max-w-[1150px] landscape:max-w-[1650px] flex-col items-center justify-center overflow-hidden px-2 sm:px-4",
    scrollWrapper: "relative flex max-h-full w-full min-h-0 flex-initial flex-col items-center overflow-hidden",
    cardsScrollArea: "max-h-full w-full min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin [scrollbar-color:#D1D5DB_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 flex flex-col items-center pt-0 pb-1 px-2",
    scrollTopShadow: "pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white/90 to-transparent z-15",
    scrollBottomShadow: "pointer-events-none absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white/95 to-transparent z-15",
    scrollIndicator: "group absolute bottom-3 left-1/2 -translate-x-1/2 z-25 flex items-center gap-2 rounded-full border-[1.5px] border-[#ED1C24] bg-white px-5 py-2 text-[#ED1C24] shadow-md shadow-red-500/15 transition-transform active:scale-95",
    scrollIndicatorIcon: "animate-bounce text-xl text-[#ED1C24]",
    layoutOverlay: (mounted: boolean): string =>
        `flex h-full w-full items-center justify-center overflow-hidden bg-transparent transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutContainer: "relative flex h-full w-full flex-col overflow-hidden items-center justify-center",
    bannerWrapper: "w-full shrink-0 pt-0 pb-0 px-4 flex flex-col items-center justify-center sticky top-0 z-10 bg-transparent",
    layoutMain: (_isLandscape: boolean): string =>
        "h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center justify-center py-2 sm:py-3 px-2",
    layoutInner: (isLandscape: boolean): string =>
        `m-auto flex flex-col items-center justify-center ${
            isLandscape ? "w-[94%] max-w-[1650px]" : "w-[96%] max-w-[1150px]"
        }`,
    layoutChildren: "w-full flex flex-col items-center justify-center",
} as const;

