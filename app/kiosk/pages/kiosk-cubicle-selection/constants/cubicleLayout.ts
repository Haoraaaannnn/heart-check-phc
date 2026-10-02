import { CSSProperties } from "react";

/** Spacing tokens for cubicle selection page layout. */
export const cubicleLayoutSpacing = {
    containerPaddingX: 24,
} as const;

/** Inline styles for cubicle selection container and content wrapper. */
export const CubicleLayoutStyle = {
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
        paddingLeft: cubicleLayoutSpacing.containerPaddingX,
        paddingRight: cubicleLayoutSpacing.containerPaddingX,
        position: "relative",
        zIndex: 10,
    },
    contentWrapper: {
        display: "flex",
        maxHeight: "100%",
        width: "100%",
        maxWidth: "1300px",
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
        maxHeight: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind CSS class name dictionary for cubicle selection layout shell. */
export const CubicleLayoutClasses = {
    container: "relative flex h-full w-full flex-col overflow-hidden bg-transparent justify-center items-center py-1 sm:py-2",
    headerWrapper: "w-full shrink-0 pt-0 pb-0 px-4 flex flex-col items-center justify-center bg-transparent",
    contentWrapper: "m-auto flex max-h-full w-full max-w-[960px] landscape:max-w-[1300px] flex-col items-center justify-center overflow-hidden px-2 sm:px-4",
    layoutOverlay: (mounted: boolean): string =>
        `flex h-full w-full items-center justify-center overflow-hidden bg-transparent transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
        }`,
    layoutContainer: "relative flex h-full w-full flex-col overflow-hidden items-center justify-center",
    cardsScrollArea: "max-h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center pt-0 pb-1 px-2",
    layoutMain: (_isLandscape: boolean): string =>
        "h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center justify-center py-2 sm:py-3 px-2",
    layoutInner: (isLandscape: boolean): string =>
        `m-auto flex flex-col items-center justify-center ${
            isLandscape ? "w-[92%] max-w-[1600px]" : "w-full max-w-[900px]"
        }`,
    layoutChildren: "w-full flex flex-col items-center justify-center",
} as const;
