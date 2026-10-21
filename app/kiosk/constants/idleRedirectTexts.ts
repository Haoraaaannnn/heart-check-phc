/**
 * @file idleRedirectTexts.ts
 * @description Centralized text and accessibility copy for the kiosk idle slideshow activation control.
 */

/** Text and accessibility labels used by the idle slideshow with Filipino as the priority language. */
export const IdleRedirectTexts = {
    /** Screen-reader label for activating the kiosk from the slideshow. */
    activateKiosk: "Pindutin ang screen upang magsimula / Touch the screen to start patient registration",
    /** Primary visible call-to-action title prompting the patient in Filipino. */
    tapToStartTitle: "Pindutin ang Screen upang Magsimula",
    /** Bilingual English subtitle directly below the primary title. */
    tapToStartSubtitle: "Tap the screen to start",
} as const;