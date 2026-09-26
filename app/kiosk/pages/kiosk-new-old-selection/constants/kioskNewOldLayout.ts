/**
 * @file kioskNewOldLayout.ts
 * @description Centralized layout styles and utility classes for the new/old patient selection page and layout shell.
 */

/** Tailwind CSS class name dictionary for new/old patient selection layout. */
export const KioskNewOldLayoutClasses = {
    layoutOverlay: (mounted: boolean): string =>
        `fixed inset-0 flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutMain: (isLandscape: boolean): string =>
        `flex h-full w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isLandscape ? "pb-[120px]" : "pb-[140px]"
        }`,
    layoutCenterWrapper: "m-auto flex w-full items-center justify-center",
    layoutLandscapeRow: "flex w-[92%] max-w-[1750px] items-center justify-center gap-[4vw]",
    layoutLandscapeLeftCol: "flex w-[45%] flex-col items-center justify-center",
    layoutLandscapeRightCol: "flex w-[55%] flex-col items-center justify-center",
    layoutPortraitStack: "flex w-full max-w-[900px] flex-col items-center justify-center px-[4vw]",
    layoutChildrenWrapper: "w-full",
} as const;
