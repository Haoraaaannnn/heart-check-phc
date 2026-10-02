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
export * from "./kioskLoadingOverlay";
export * from "./kioskBackButton";

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
        backgroundColor: themeColors.white,
    },

    /**
     * Dedicated in-flow top navigation row for the back button.
     * Prevents the back button from overflowing or sitting alongside page header texts.
     */
    topNavWrapper: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexShrink: 0,
        paddingTop: "clamp(12px, 1.8vh, 24px)",
        paddingBottom: "clamp(4px, 0.8vh, 12px)",
        paddingLeft: "clamp(16px, 2.5vw, 32px)",
        paddingRight: "clamp(16px, 2.5vw, 32px)",
        zIndex: 20,
    },

    /**
     * Flexible content area taking up all available room between top nav and footer,
     * centering page contents both vertically and horizontally.
     */
    main: {
        display: "flex",
        minHeight: 0,
        width: "100%",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
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
    topNavWrapper: "w-full flex-shrink-0 flex items-center justify-start px-4 sm:px-8 pt-3 sm:pt-6 pb-1 sm:pb-2 z-20",

    /**
     * Main scroll and flex container utility classes, centering page content.
     */
    main: "flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden",

    /**
     * Footer structural wrapper utility classes.
     */
    footerWrapper: "w-full flex-shrink-0",
} as const;
