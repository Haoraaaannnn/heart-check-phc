/**
 * @file kioskServicesTexts.ts
 * @description Centralized text copy and accessibility labels for the kiosk services menu.
 *
 * @remarks
 * Contains bilingual Filipino and English text strings for interactive elements
 * including the scrollable service card indicator badge and accessibility labels.
 */

export const KioskServicesTexts = {
    /** Prompt indicating that more services are available further down by scrolling. */
    scrollDownPromptFil: "Mag-scroll pababa para sa iba pang serbisyo",
    scrollDownPromptEn: "Scroll down for more services",

    /** Combined bilingual text label for the floating scroll indicator badge. */
    scrollDownBadge: "I-scroll pababa para sa iba pang serbisyo • Scroll down for more services",

    /** Short bilingual label for the floating scroll indicator badge. */
    scrollDownBadgeShort: "I-scroll pababa • Scroll down for more",

    /** Accessibility label for screen readers on the scroll-down action button. */
    scrollDownAria: "Mag-scroll pababa upang makita ang iba pang mga serbisyo",
} as const;
