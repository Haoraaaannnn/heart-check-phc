/**
 * @file smsLayout.ts
 * @description Centralized layout styles and utility classes for SMS input page and phone entry layout.
 */

import { CSSProperties } from "react";

/** Spacing tokens for SMS page layout. */
export const smsLayoutSpacing = {
    containerPaddingX: 16,
    contentGap: "clamp(8px, 1.6vh, 20px)",
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
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for SMS input layouts. */
export const SMSLayoutClasses = {
    container: "h-full w-full flex flex-col items-center justify-center overflow-hidden bg-transparent px-4 py-2 sm:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    layoutContainer: "h-full w-full flex flex-col items-center justify-center overflow-hidden bg-transparent px-4 py-2 sm:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    contentWrapper: "w-full max-w-[540px] landscape:max-w-[1050px] m-auto flex flex-col items-center justify-center",
    entryGrid: "w-full grid grid-cols-1 landscape:grid-cols-2 gap-2 sm:gap-4 lg:gap-8 items-center justify-center portrait:max-w-[540px] landscape:max-w-[1050px] mx-auto",
    entryLeftCol: "portrait:contents landscape:flex landscape:flex-col landscape:gap-3 w-full max-w-[540px] mx-auto",
    entryRightCol: "portrait:order-2 landscape:order-none flex flex-col items-center justify-center w-full max-w-[540px] mx-auto",
    phoneInputWrapper: "portrait:order-1 landscape:order-1 w-full max-w-[540px] mx-auto",
    instructionWrapper: "portrait:order-3 landscape:order-2 w-full max-w-[540px] mx-auto",
    continueWrapper: "portrait:order-4 landscape:order-3 w-full max-w-[540px] mx-auto",
} as const;

