/**
 * @file smsInputTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for the SMS input flow.
 */

import { SMSInstructionTexts } from "@/app/kiosk/pages/sms-input/constants/smsInstructionTexts";
import { SMSContinueButtonTexts } from "@/app/kiosk/pages/sms-input/constants/smsContinueButtonTexts";
import { SMSModalTexts } from "@/app/kiosk/pages/sms-input/constants/smsModalTexts";
import { SMSValidationTexts } from "@/app/kiosk/pages/sms-input/constants/smsValidationTexts";

export * from "@/app/kiosk/pages/sms-input/constants/smsInstructionTexts";
export * from "@/app/kiosk/pages/sms-input/constants/smsContinueButtonTexts";
export * from "@/app/kiosk/pages/sms-input/constants/smsModalTexts";
export * from "@/app/kiosk/pages/sms-input/constants/smsValidationTexts";

/**
 * Composite text copy dictionary for SMS input screens and modals.
 */
export const smsInputTexts = {
    ...SMSInstructionTexts,
    ...SMSContinueButtonTexts,
    ...SMSModalTexts,
    ...SMSValidationTexts,
} as const;
