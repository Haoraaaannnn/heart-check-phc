/**
 * Centralized kiosk text constants and re-exports.
 *
 * Each kiosk screen maintains its own dedicated text file under its
 * `constants/<feature>Texts.ts` module to keep UI copy cleanly decoupled
 * from styles and business logic.
 *
 * This central catalog re-exports all text objects for convenient, uniform access.
 *
 * @module constants/kioskTexts
 */

// Kiosk Header & Services Banner
export { KioskBannerServiceTexts } from "@/app/kiosk/pages/kiosk-services/constants/kioskBannerTexts";
export { KioskHeaderTexts } from "@/app/kiosk/pages/kiosk-services/constants/kioskHeaderTexts";

// Patient Type (New vs Old) Selection
export { kioskNewOldTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldTexts";

// Unified Age Category (Adult vs Pedia) Selection
export { categorySelectionTexts } from "@/app/kiosk/pages/category-selection/constants/categorySelectionTexts";

// Doctor Cubicle Selection (Consultation)
export { cubicleSelectionTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelectionTexts";

// Service Confirmation Modal
export { confirmationTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationTexts";

// Phone Number / SMS Input Step
export { smsInputTexts } from "@/app/kiosk/pages/sms-input/constants/smsInputTexts";

// Ticket Printing & Queue Number Step
export { queuePrintTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";
