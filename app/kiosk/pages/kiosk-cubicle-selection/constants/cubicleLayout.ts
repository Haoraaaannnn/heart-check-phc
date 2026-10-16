/**
 * @file cubicleLayout.ts
 * @description Centralized layout styles and utility classes for the cubicle selection page,
 * matching the scrollable architecture, indicator pill, and single-container layout of `kiosk-services`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Spacing tokens for cubicle selection page layout. */
export const cubicleLayoutSpacing = {
    containerPaddingX: 24,
} as const;

/** Inline styles for cubicle selection container and content wrapper. */
export const CubicleLayoutStyle = {
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
        paddingLeft: cubicleLayoutSpacing.containerPaddingX,
        paddingRight: cubicleLayoutSpacing.containerPaddingX,
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

/** Tailwind CSS class name dictionary for cubicle selection layout shell. */
export const CubicleLayoutClasses = {
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
    layoutMain: (_isLandscape: boolean): string =>
        "h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center justify-center py-2 sm:py-3 px-2",
    layoutInner: (isLandscape: boolean): string =>
        `m-auto flex flex-col items-center justify-center ${
            isLandscape ? "w-[92%] max-w-[1600px]" : "w-full max-w-[900px]"
        }`,
    layoutChildren: "w-full flex flex-col items-center justify-center",
} as const;
