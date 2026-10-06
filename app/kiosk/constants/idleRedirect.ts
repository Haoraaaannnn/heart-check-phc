/**
 * @file idleRedirect.ts
 * @description Image and presentation settings for the kiosk inactivity slideshow.
 *
 * @remarks
 * The slideshow reuses the numbered images stored in `public/images`; no
 * image files are copied or modified by the idle flow.
 */

import { CSSProperties } from "react";

/** Existing public image paths displayed by the kiosk idle slideshow. */
export const IDLE_SLIDESHOW_IMAGES = [
    "/images/1.jpg",
    "/images/2.jpg",
    "/images/3.jpg",
] as const;

/** Inline presentation styles for the full-screen slideshow control. */
export const IdleRedirectStyle = {
    slideshowButton: {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        padding: 0,
        border: 0,
        backgroundColor: "#000",
        cursor: "pointer",
        zIndex: 100,
    },
    footerOverlay: {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        pointerEvents: "none",
        zIndex: 101,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind classes for slideshow image visibility and transitions. */
export const IdleRedirectClasses = {
    /**
     * Returns cover-fit and cross-fade classes for one slideshow image.
     *
     * @param isActive - Whether the image is the currently selected slide.
     * @returns Image classes with the appropriate opacity state.
     */
    image: (isActive: boolean): string =>
        `object-cover transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-0"}`,
} as const;