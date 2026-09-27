/**
 * @file confirmationLayout.ts
 * @description Centralized layout styles and utility classes for confirmation page and shell layout.
 */

import { CSSProperties } from "react";

/** Layout style definitions for confirmation page. */
export const ConfirmationLayoutStyle = {
    pageContainer: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        overflow: "hidden",
    },
    descriptionsWrapper: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 0,
        overflow: "hidden",
    },
    actionsWrapper: {
        flexShrink: 0,
        width: "100%",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for confirmation layouts. */
export const ConfirmationLayoutClasses = {
    pageNoService: "h-full flex items-center justify-center bg-white text-gray-500 text-xl font-medium",
    pageContainer: "h-full flex flex-col w-full bg-white overflow-hidden",
    pageBannerWrapper: "shrink-0",
    pageDescriptionsWrapper: "flex-1 flex flex-col justify-center px-6 md:px-10 py-6 min-h-0 overflow-hidden",
    pageActionsWrapper: "shrink-0 px-6 md:px-10 pb-12 pt-4 w-full",
    layoutOverlay: (mounted: boolean): string =>
        `flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutMain: "flex h-full w-full flex-col items-center",
} as const;
