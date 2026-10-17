/**
 * @file smsInput.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for the SMS input feature.
 */

export * from "@/app/kiosk/pages/sms-input/constants/smsInstruction";
export * from "@/app/kiosk/pages/sms-input/constants/smsPhoneInput";
export * from "@/app/kiosk/pages/sms-input/constants/smsNumPad";
export * from "@/app/kiosk/pages/sms-input/constants/smsContinueButton";
export * from "@/app/kiosk/pages/sms-input/constants/smsLayout";
export * from "@/app/kiosk/pages/sms-input/constants/smsInputTexts";
export * from "@/app/kiosk/pages/sms-input/constants/smsPrefixRules";

import { SMSPhoneInputClasses } from "@/app/kiosk/pages/sms-input/constants/smsPhoneInput";
import { SMSNumPadClasses } from "@/app/kiosk/pages/sms-input/constants/smsNumPad";
import { SMSContinueButtonClasses } from "@/app/kiosk/pages/sms-input/constants/smsContinueButton";
import { SMSLayoutClasses } from "@/app/kiosk/pages/sms-input/constants/smsLayout";

/**
 * Composite class dictionary combining SMS input utility classes for backward compatibility.
 */
export const SMSInputClasses = {
    ...SMSPhoneInputClasses,
    ...SMSNumPadClasses,
    ...SMSContinueButtonClasses,
    ...SMSLayoutClasses,
} as const;
