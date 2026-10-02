/**
 * @file kioskNewOldLayout.ts
 * @description Centralized layout styles and utility classes for the new/old patient selection page and layout shell.
 *
 * @remarks
 * The patient category selection screen contains fixed choices (New Patient vs Returning Patient)
 * that do not increase dynamically. The layout is strictly non-scrollable (`overflow-hidden`)
 * and fits cleanly within the viewport on both portrait and landscape orientations.
 */

/** Tailwind CSS class name dictionary for new/old patient selection layout. */
export const KioskNewOldLayoutClasses = {
    layoutOverlay: (mounted: boolean): string =>
        `flex h-full w-full items-center justify-center overflow-hidden bg-transparent transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutContainer: "relative flex h-full w-full flex-col overflow-hidden bg-transparent items-center justify-center",
    layoutLandscapeMain: "flex h-full w-full min-h-0 flex-1 overflow-hidden py-2 sm:py-4 items-center justify-center",
    layoutLandscapeRow: "flex w-[92%] max-w-[1750px] h-full items-center justify-center gap-[4vw]",
    layoutLandscapeLeftCol: "flex w-[45%] h-full shrink-0 flex-col items-center justify-center",
    layoutLandscapeRightCol: "flex w-[55%] h-full min-h-0 flex-col items-center justify-center gap-0 overflow-hidden",
    bannerWrapper: "w-full shrink-0 flex flex-col items-center justify-center pb-0",
    layoutPortraitMain: "flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden items-center justify-center gap-2 sm:gap-3 py-2 sm:py-4 px-2 sm:px-4 m-auto",
    portraitHeaderWrapper: "w-full shrink-0 flex flex-col items-center justify-center pt-1 sm:pt-3 px-4",
    portraitSelectionGroup: "w-full flex flex-col items-center justify-center gap-0",
    cardsArea: "w-full overflow-hidden flex items-center justify-center",
    layoutChildrenWrapper: "w-full max-w-[900px] mx-auto flex items-center justify-center",
} as const;

