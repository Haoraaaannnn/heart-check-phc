/**
 * @file queuePrintLayout.ts
 * @description Centralized layout utility classes for the queue print screen.
 *
 * Provides responsive utility classes ensuring zero-scroll fitting across both
 * landscape (16:9 widescreen / desktop) and portrait (tablet / mobile) kiosks.
 *
 * @module app/kiosk/pages/queue-print/constants/queuePrintLayout
 */

/** Tailwind CSS class name dictionary for ticket printing layout. */
export const QueuePrintLayoutClasses = {
    /**
     * Outermost layout container for the print screen shell.
     *
     * @param mounted - Client hydration state.
     * @param isLandscape - Window orientation state.
     * @returns Full Tailwind utility class string.
     */
    layoutContainer: (mounted: boolean, isLandscape: boolean): string =>
        `h-full w-full flex flex-col items-center justify-start overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        } ${isLandscape ? "pb-1" : "pb-2"}`,

    /**
     * Flexible main content zone centering ticket and fallback cards without scrollbars.
     */
    layoutMain: "flex-1 min-h-0 w-full flex flex-col items-center justify-center px-2 sm:px-4 py-1 overflow-hidden",
} as const;

