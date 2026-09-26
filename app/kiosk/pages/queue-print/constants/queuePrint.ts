/**
 * @file queuePrint.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for queue ticket printing.
 */

export * from "./printHeader";
export * from "./printFooter";
export * from "./queuePrintTicket";
export * from "./queuePrintLayout";
export * from "./queuePrintTexts";

import { QueuePrintLayoutClasses } from "./queuePrintLayout";

/**
 * Composite class dictionary combining queue ticket printing utility classes for backward compatibility.
 */
export const QueuePrintClasses = {
    ...QueuePrintLayoutClasses,
} as const;
