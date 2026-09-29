/**
 * @file smsLayout.ts
 * @description Centralized layout styles and utility classes for SMS input page and phone entry layout.
 */

import { CSSProperties } from "react";

/** Spacing tokens for SMS page layout. */
export const smsLayoutSpacing = {
    containerPaddingX: 24,
    contentGap: "clamp(16px, 2.5vh, 28px)",
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
        overflowY: "auto",
    },
    contentWrapper: {
        margin: "auto",
        display: "flex",
        width: "100%",
        maxWidth: 1050,
        flexDirection: "column",
        alignItems: "center",
        gap: smsLayoutSpacing.contentGap,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for SMS input layouts. */
export const SMSLayoutClasses = {
    container: "landscape:pt-6 landscape:pb-[80px] portrait:pt-20 portrait:pb-[120px] h-full w-full flex flex-col items-center justify-center overflow-y-auto bg-white",
    layoutContainer: "landscape:pt-6 landscape:pb-[80px] portrait:pt-20 portrait:pb-[120px] h-full w-full flex flex-col items-center justify-center overflow-y-auto bg-white",
    contentWrapper: "w-full max-w-[1050px] mx-auto flex flex-col items-center",
    entryGrid: "w-full grid grid-cols-1 landscape:grid-cols-2 gap-6 lg:gap-10 items-center justify-center",
    entryLeftCol: "portrait:contents landscape:flex landscape:flex-col landscape:gap-4 w-full max-w-[480px] mx-auto",
    entryRightCol: "portrait:order-2 landscape:order-none flex flex-col items-center justify-center w-full max-w-[440px] mx-auto",
    phoneInputWrapper: "portrait:order-1 landscape:order-1 w-full",
    instructionWrapper: "portrait:order-3 landscape:order-2 w-full",
    continueWrapper: "portrait:order-4 landscape:order-3 w-full",
} as const;

