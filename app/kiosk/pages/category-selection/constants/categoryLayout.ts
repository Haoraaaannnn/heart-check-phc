/**
 * @file categoryLayout.ts
 * @description Centralized layout styles and utility classes for the category selection page.
 */

import { CSSProperties } from "react";

/** Spacing tokens for category selection page layout. */
export const categoryLayoutSpacing = {
    containerPaddingX: 24,
    contentGap: "clamp(24px, 4vh, 48px)",
} as const;

/** Inline styles for category selection container and wrapper. */
export const CategoryLayoutStyle = {
    container: {
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: categoryLayoutSpacing.containerPaddingX,
        paddingRight: categoryLayoutSpacing.containerPaddingX,
        overflowY: "auto",
    },
    contentWrapper: {
        margin: "auto",
        display: "flex",
        width: "100%",
        maxWidth: "960px",
        flexDirection: "column",
        alignItems: "center",
        gap: categoryLayoutSpacing.contentGap,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for category selection page layout. */
export const CategoryLayoutClasses = {
    container: "landscape:pb-[120px] portrait:pb-[140px]",
} as const;
