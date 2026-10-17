/**
 * @file queuePrint.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for queue ticket printing.
 */

export * from "@/app/kiosk/pages/queue-print/constants/printHeader";
export * from "@/app/kiosk/pages/queue-print/constants/printFooter";
export * from "@/app/kiosk/pages/queue-print/constants/queuePrintTicket";
export * from "@/app/kiosk/pages/queue-print/constants/queuePrintLayout";
export * from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";

import { QueuePrintLayoutClasses } from "@/app/kiosk/pages/queue-print/constants/queuePrintLayout";

/**
 * Composite class dictionary combining queue ticket printing utility classes for backward compatibility.
 */
export const QueuePrintClasses = {
    ...QueuePrintLayoutClasses,
} as const;
