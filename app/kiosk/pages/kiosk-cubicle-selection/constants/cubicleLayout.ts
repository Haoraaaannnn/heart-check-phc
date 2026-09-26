/**
 * @file cubicleLayout.ts
 * @description Centralized layout styles and utility classes for cubicle selection layout shell.
 */

/** Tailwind CSS class name dictionary for cubicle selection layout shell. */
export const CubicleLayoutClasses = {
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
