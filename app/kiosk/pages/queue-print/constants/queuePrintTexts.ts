/**
 * @file queuePrintTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for queue printing.
 */

import { PrintHeaderTexts } from "@/app/kiosk/pages/queue-print/constants/printHeaderTexts";
import { PrintFooterTexts } from "@/app/kiosk/pages/queue-print/constants/printFooterTexts";
import { QueuePrintTicketTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts";

export * from "@/app/kiosk/pages/queue-print/constants/printHeaderTexts";
export * from "@/app/kiosk/pages/queue-print/constants/printFooterTexts";
export * from "@/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts";

/**
 * Composite text copy dictionary for queue ticket printing.
 */
export const queuePrintTexts = {
    ...PrintHeaderTexts,
    ...PrintFooterTexts,
    ...QueuePrintTicketTexts,
} as const;
