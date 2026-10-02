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
        paddingBottom: 0,
        paddingLeft: categoryLayoutSpacing.containerPaddingX,
        paddingRight: categoryLayoutSpacing.containerPaddingX,
        position: "relative",
        zIndex: 10,
    },
    contentWrapper: {
        display: "flex",
        width: "100%",
        maxWidth: "960px",
        maxHeight: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        margin: "auto",
    },
    cardsScrollArea: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        flex: "0 1 auto",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for category selection page layout. */
export const CategoryLayoutClasses = {
    container: "relative flex h-full w-full flex-col overflow-hidden bg-transparent justify-center items-center py-1 sm:py-2",
    headerWrapper: "w-full shrink-0 pt-0 pb-0 px-4 flex flex-col items-center justify-center bg-transparent",
    cardsArea: "w-full flex items-center justify-center overflow-hidden",
    cardsInnerWrapper: "m-auto flex w-full max-w-[960px] flex-col items-center justify-center px-4",
    contentWrapper: "m-auto flex w-full max-w-[960px] flex-col items-center justify-center overflow-hidden px-4 gap-0",
    cardsScrollArea: "w-full min-h-0 flex flex-col items-center pt-0 pb-2 px-2",
} as const;
