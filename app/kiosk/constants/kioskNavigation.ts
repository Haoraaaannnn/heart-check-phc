/**
 * Canonical route paths across the kiosk patient flow.
 */
export const KIOSK_ROUTES = {
    /** Entrance patient type selection: new vs old patient. */
    NEW_OLD_SELECTION: "/kiosk/pages/kiosk-new-old-selection",
    /** Service menu list filtered by patient type. */
    SERVICES: "/kiosk/pages/kiosk-services",
    /** Unified age category selection (Adult vs Pedia) — used by both Consultation and OPD Screening. */
    CATEGORY_SELECTION: "/kiosk/pages/category-selection",
    /** Cubicle selection for consultation patients. */
    CUBICLE_SELECTION: "/kiosk/pages/kiosk-cubicle-selection",
    /** Mobile number entry for SMS notifications. */
    SMS_INPUT: "/kiosk/pages/sms-input",
    /** Queue ticket display and physical printing dispatch. */
    QUEUE_PRINT: "/kiosk/pages/queue-print",
    /** Standalone service confirmation fallback. */
    CONFIRMATION: "/kiosk/pages/confirmation",
    /** Full-screen destination shown after kiosk inactivity. */
    SLIDESHOW: "/kiosk/slideshow",
} as const;

/** Shared timeout and delay constants for the kiosk. */
export const KIOSK_TIMING = {
    /** Auto-redirect timeout after printing ticket (5 seconds). */
    PRINT_REDIRECT_MS: 5000,
    /** Page fade-in transition duration (300ms). */
    TRANSITION_DURATION_MS: 300,
    /** Patient-flow inactivity period before showing the slideshow (3 minutes). */
    IDLE_REDIRECT_MS: 25 * 1000,
    /** Time each idle slideshow image remains visible. */
    SLIDESHOW_INTERVAL_MS: 3000,
} as const;
