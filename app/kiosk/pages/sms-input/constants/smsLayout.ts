/**
 * @file smsLayout.ts
 * @description Centralized layout styles and utility classes for SMS input page and phone entry layout.
 */

import { CSSProperties } from "react";

/** Spacing tokens for SMS page layout. */
export const smsLayoutSpacing = {
    containerPaddingX: 16,
    contentGap: "clamp(8px, 1.4vh, 18px)",
} as const;

/** Layout style definitions for SMS phone entry container. */
export const SMSLayoutStyle = {
    container: {
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: smsLayoutSpacing.containerPaddingX,
        paddingRight: smsLayoutSpacing.containerPaddingX,
        overflow: "hidden",
    },
    contentWrapper: {
        margin: "auto",
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: smsLayoutSpacing.contentGap,
    },
    entryLeftCol: {
        display: "flex",
        flexDirection: "column",
        gap: "clamp(8px, 1.2vh, 14px)",
        width: "100%",
        maxWidth: 540,
        margin: "0 auto",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for SMS input layouts. */
export const SMSLayoutClasses = {
    container: "h-full w-full flex flex-col items-center justify-center bg-transparent px-3 sm:px-4 py-1 my-auto overflow-hidden",
    layoutContainer: "h-full w-full flex flex-col items-center justify-center bg-transparent px-3 sm:px-4 py-1 my-auto overflow-hidden",
    contentWrapper: "w-full max-w-[420px] landscape:max-w-[960px] my-auto flex flex-col items-center justify-center px-2 sm:px-4 py-1 sm:py-2",
    entryGrid: "w-full grid grid-cols-1 landscape:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start justify-center max-w-[420px] landscape:max-w-[960px] mx-auto",
    leftCol: "flex flex-col gap-3 sm:gap-4 w-full max-w-[420px] landscape:max-w-[460px] mx-auto justify-start",
    rightCol: "flex flex-col gap-3 sm:gap-4 w-full max-w-[420px] mx-auto items-center justify-start",
    phoneInputWrapper: "w-full max-w-[420px] landscape:max-w-[460px] mx-auto",
    instructionWrapper: "w-full max-w-[420px] landscape:max-w-[460px] mx-auto",
    continueWrapper: "w-full max-w-[420px] mx-auto",
} as const;

