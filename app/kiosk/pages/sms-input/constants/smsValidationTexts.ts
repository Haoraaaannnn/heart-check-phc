/**
 * @file smsValidationTexts.ts
 * @description Bilingual text constants for SMS phone number validation errors and hints.
 *
 * Centralizes patient-facing validation error messages in accordance with AGENTS.md rules.
 */

import { PhoneValidationErrorReason } from "../utils/phoneValidation";

/**
 * Text messages for phone number validation feedback and keypad warnings.
 */
export const SMSValidationTexts = {
    /** Hint shown when an invalid starting digit is attempted. */
    mustStartWith09Fil: "Ang numero ng mobile ay dapat magsimula sa 09.",
    mustStartWith09En: "Mobile number must start with 09.",

    /** Error messages mapped by validation failure reason. */
    errors: {
        incomplete: {
            fil: "Kailangan ng eksaktong 11 digits (09XXXXXXXXX).",
            en: "Exactly 11 digits required (09XXXXXXXXX).",
        },
        invalidStart: {
            fil: "Ang numero ng mobile ay dapat magsimula sa 09.",
            en: "Mobile number must start with 09.",
        },
        invalidPrefix: {
            fil: "Hindi kilalang mobile network prefix sa Pilipinas.",
            en: "Unrecognized Philippine mobile network prefix.",
        },
        sequential: {
            fil: "Hindi wastong numero. Iwasan ang sunod-sunod na numero (hal. 123456).",
            en: "Invalid number. Avoid sequential numbers (e.g. 123456).",
        },
        repeated: {
            fil: "Hindi wastong numero. Iwasan ang paulit-ulit na parehong numero.",
            en: "Invalid number. Avoid repetitive identical numbers.",
        },
        lowEntropy: {
            fil: "Hindi wastong numero ng mobile. Pakilagay ang totoong numero.",
            en: "Invalid mobile number. Please enter a genuine number.",
        },
        trollPattern: {
            fil: "Hindi wastong pattern ng mobile number.",
            en: "Invalid mobile number pattern.",
        },
    } satisfies Record<PhoneValidationErrorReason, { fil: string; en: string }>,
} as const;
