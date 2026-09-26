/**
 * @file queuePrintTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for queue printing.
 */

import { PrintHeaderTexts } from "./printHeaderTexts";
import { PrintFooterTexts } from "./printFooterTexts";
import { QueuePrintTicketTexts } from "./queuePrintTicketTexts";

export * from "./printHeaderTexts";
export * from "./printFooterTexts";
export * from "./queuePrintTicketTexts";

/**
 * Composite text copy dictionary for queue ticket printing.
 */
export const queuePrintTexts = {
    ...PrintHeaderTexts,
    ...PrintFooterTexts,
    ...QueuePrintTicketTexts,
} as const;
