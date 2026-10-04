/**
 * @fileoverview Presentation and image configuration for the idle welcome screen.
 *
 * Keeps slideshow layout rules and public image paths outside the route
 * component, following the kiosk feature's constants convention.
 */

/** Full-viewport slideshow layout and image classes. */
export const IdleSlideshowClasses = {
    /** Fills the main kiosk area while leaving the coded footer visible. */
    screen: "relative min-h-0 w-full flex-1 overflow-hidden bg-white",
    /** Full-screen activation target with a visible keyboard focus indicator. */
    activate: "absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline focus-visible:outline-8 focus-visible:outline-red-600",
    /** Crops the facility photo to cover the entire display. */
    image: "object-cover object-center",
} as const;

/** Public image paths available for the idle slideshow. */
export const IDLE_SLIDESHOW_IMAGES: readonly [string, ...string[]] = [
    "/images/1.jpg",
    "/images/2.jpg",
    "/images/3.jpg",
];