/**
 * @file smsInputTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for the SMS input flow.
 */

import { SMSInstructionTexts } from "./smsInstructionTexts";
import { SMSContinueButtonTexts } from "./smsContinueButtonTexts";
import { SMSModalTexts } from "./smsModalTexts";

export * from "./smsInstructionTexts";
export * from "./smsContinueButtonTexts";
export * from "./smsModalTexts";

/**
 * Composite text copy dictionary for SMS input screens and modals.
 */
export const smsInputTexts = {
    ...SMSInstructionTexts,
    ...SMSContinueButtonTexts,
    ...SMSModalTexts,
} as const;
