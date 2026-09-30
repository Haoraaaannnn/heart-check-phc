/**
 * @file categoryLayout.ts
 * @description Centralized layout styles and utility classes for the category selection page.
 *
 * @remarks
 * The age category selection screen contains fixed choices (Adult vs Pedia) that do not
 * increase dynamically. The layout is strictly non-scrollable (`overflow-hidden`)
 * and fits cleanly within the available viewport on both portrait and landscape orientations.
 */

import { CSSProperties } from "react";

/** Spacing tokens for category selection page layout. */
export const categoryLayoutSpacing = {
    containerPaddingX: 24,
    contentGap: "clamp(16px, 2.5vh, 36px)",
} as const;

/** Inline styles for category selection container and wrapper. */
export const CategoryLayoutStyle = {
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
        paddingLeft: categoryLayoutSpacing.containerPaddingX,
        paddingRight: categoryLayoutSpacing.containerPaddingX,
    },
    contentWrapper: {
        display: "flex",
        width: "100%",
        maxWidth: "960px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "auto",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for category selection page layout. */
export const CategoryLayoutClasses = {
    container: "relative flex h-full w-full flex-col overflow-hidden bg-transparent justify-center items-center py-2 sm:py-4",
    headerWrapper: "w-full shrink-0 pt-0 pb-1 px-4 flex flex-col items-center justify-center",
    cardsArea: "w-full flex items-center justify-center overflow-hidden",
    cardsInnerWrapper: "m-auto flex w-full max-w-[960px] flex-col items-center justify-center px-4",
    contentWrapper: "m-auto flex w-full max-w-[960px] flex-col items-center justify-center px-4",
} as const;
