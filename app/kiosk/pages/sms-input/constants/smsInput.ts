/**
 * @file smsInput.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for the SMS input feature.
 */

export * from "./smsBanner";
export * from "./smsInstruction";
export * from "./smsPhoneInput";
export * from "./smsNumPad";
export * from "./smsContinueButton";
export * from "./smsLayout";
export * from "./smsInputTexts";

import { SMSPhoneInputClasses } from "./smsPhoneInput";
import { SMSNumPadClasses } from "./smsNumPad";
import { SMSContinueButtonClasses } from "./smsContinueButton";
import { SMSLayoutClasses } from "./smsLayout";

/**
 * Composite class dictionary combining SMS input utility classes for backward compatibility.
 */
export const SMSInputClasses = {
    ...SMSPhoneInputClasses,
    ...SMSNumPadClasses,
    ...SMSContinueButtonClasses,
    ...SMSLayoutClasses,
} as const;
