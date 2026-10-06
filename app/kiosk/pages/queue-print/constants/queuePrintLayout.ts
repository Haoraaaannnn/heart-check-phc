/**
 * @file queuePrintLayout.ts
 * @description Centralized layout utility classes for the queue print screen.
 */

/** Tailwind CSS class name dictionary for ticket printing layout. */
export const QueuePrintLayoutClasses = {
    layoutContainer: (mounted: boolean, isLandscape: boolean): string =>
        `h-full w-full flex flex-col justify-between overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        } ${isLandscape ? "pb-2" : "pb-4"}`,
    layoutMain: "flex-1 min-h-0 w-full flex items-center justify-center px-4 py-2",
} as const;

