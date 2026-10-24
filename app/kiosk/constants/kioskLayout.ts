/**
 * @file kioskLayout.ts
 * @description Centralized layout styles and Tailwind utility class names for the root kiosk layout shell.
 *
 * @remarks
 * Component-specific styles and class names for subcomponents like the loading overlay
 * and universal back button are split into dedicated constants files and re-exported here
 * for backwards compatibility.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export dedicated constants for subcomponents
export * from "@/app/kiosk/constants/kioskLoadingOverlay";
export * from "@/app/kiosk/constants/kioskBackButton";

/**
 * Static inline style definitions for the primary kiosk layout container and content sections.
 */
export const KioskLayoutStyle = {
    /**
     * Fixed full-viewport shell wrapping the kiosk header, main content, and footer.
     */
    container: {
        position: "fixed",
        inset: 0,
        display: "flex",
        height: "100dvh",
        width: "100dvw",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
    },

    /**
     * Dedicated in-flow top navigation row for the back button and step progress journey bar.
     * Prevents the back button from overflowing or sitting alongside page header texts.
     */
    topNavWrapper: {
        width: "100%",
        minHeight: "clamp(52px, 6vh, 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        paddingTop: "clamp(8px, 1.2vh, 14px)",
        paddingBottom: "clamp(4px, 0.6vh, 8px)",
        paddingLeft: "clamp(14px, 2vw, 28px)",
        paddingRight: "clamp(14px, 2vw, 28px)",
        zIndex: 20,
    },

    /**
     * Flexible content area taking up all available room between top nav and footer,
     * centering page contents while gracefully allowing vertical scroll on compact viewports.
     */
    main: {
        display: "flex",
        minHeight: 0,
        width: "100%",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        overflowX: "hidden",
    },

    /**
     * Dedicated fixed-shrink footer container wrapping KioskHeader.
     */
    footerWrapper: {
        width: "100%",
        flexShrink: 0,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Tailwind utility class names for responsive layout structure and hydration transitions.
 */
export const KioskLayoutClasses = {
    /**
     * Returns container transition and opacity classes depending on client hydration state.
     *
     * @param mounted - Whether the client has successfully hydrated.
     * @returns Full Tailwind class name string for the layout container.
     */
    container: (mounted: boolean): string =>
        `fixed inset-0 flex h-dvh w-dvw flex-col overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,

    /**
     * Dedicated top navigation wrapper utility classes.
     */
    topNavWrapper: "w-full flex-shrink-0 flex items-center justify-between min-h-[52px] sm:min-h-[64px] px-3 sm:px-6 pt-2 sm:pt-3 pb-1 sm:pb-2 z-20",

    /**
     * Main scroll and flex container utility classes, centering page content while allowing scroll on compact screens.
     */
    main: "flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden [scrollbar-width:thin]",

    /**
     * Footer structural wrapper utility classes.
     */
    footerWrapper: "w-full flex-shrink-0",
} as const;
