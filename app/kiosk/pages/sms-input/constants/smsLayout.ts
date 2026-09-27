/**
 * @file smsLayout.ts
 * @description Centralized layout styles and utility classes for SMS input page and phone entry layout.
 */

import { CSSProperties } from "react";

/** Layout style definitions for SMS phone entry container. */
export const SMSLayoutStyle = {
    pageContainer: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for SMS input layouts. */
export const SMSLayoutClasses = {
    pageContainer: "h-full w-full flex flex-col overflow-hidden bg-white p-0",
    pageContent: "flex flex-col w-full h-full gap-2 md:gap-4 overflow-hidden",
    pageBannerWrapper: "flex-none",
    pageEntryWrapper: "flex-1 min-h-0 h-full flex flex-col overflow-hidden",
    layoutContainer: "h-full w-full flex flex-col overflow-hidden",
    entryGrid: "h-full min-h-0 w-full grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 md:gap-6 p-4 md:p-6 overflow-hidden bg-white landscape:grid-cols-[1.2fr_1fr] landscape:grid-rows-[auto_minmax(0,1fr)_auto] landscape:gap-x-12 landscape:gap-y-6",
    entryLeftCol: "flex w-full flex-col gap-3 sm:gap-4 landscape:col-start-1 landscape:row-start-1 landscape:row-span-2 landscape:justify-center landscape:items-start",
    entryRightCol: "flex h-full w-full items-center justify-center portrait:py-4 landscape:items-center landscape:justify-end landscape:col-start-2 landscape:row-start-1 landscape:row-span-2 landscape:px-4 lg:landscape:px-8",
    entryBottomRow: "flex-none w-full landscape:col-start-1 landscape:col-end-3 landscape:row-start-3",
} as const;
