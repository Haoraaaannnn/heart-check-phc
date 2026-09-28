/**
 * @file phoneValidation.ts
 * @description Utility functions and Philippine telecommunications prefix rules
 * for validating mobile phone numbers entered at the self-service kiosk.
 *
 * Implements strict format enforcement (11 digits starting with 09),
 * NTC-allocated mobile network prefix verification, sequential run detection,
 * repetition limits, and entropy checks to prevent troll and dummy numbers.
 */

/**
 * Recognized Philippine mobile telecommunication network prefixes (NTC allocated).
 * Includes prefixes for Globe, TM, GOMO, Smart, TNT, Sun Cellular, and DITO.
 */
export const VALID_PH_MOBILE_PREFIXES: ReadonlySet<string> = new Set([
    // Globe / TM / GOMO
    "0905", "0906", "0915", "0916", "0917", "0925", "0926", "0927",
    "0935", "0936", "0945", "0953", "0954", "0955", "0956", "0965",
    "0966", "0967", "0975", "0976", "0977", "0978", "0979", "0995",
    "0996", "0997",
    // Smart / TNT / Sun
    "0907", "0908", "0909", "0910", "0911", "0912", "0914", "0918",
    "0919", "0920", "0921", "0922", "0923", "0924", "0928", "0929",
    "0930", "0931", "0932", "0933", "0934", "0938", "0939", "0942",
    "0943", "0946", "0947", "0948", "0949", "0950", "0951", "0960",
    "0961", "0963", "0964", "0968", "0969", "0970", "0971", "0972",
    "0973", "0974", "0981", "0985", "0989", "0992", "0998", "0999",
    // DITO Telecommunity
    "0991", "0993", "0994",
]);

/**
 * Reason codes identifying why a phone number failed validation.
 */
export type PhoneValidationErrorReason =
    | "incomplete"
    | "invalidStart"
    | "invalidPrefix"
    | "sequential"
    | "repeated"
    | "lowEntropy"
    | "trollPattern";

/**
 * Result contract returned by {@link validatePhMobileNumber}.
 */
export interface PhoneValidationResult {
    /** Whether the phone number is fully valid and ready for submission. */
    isValid: boolean;
    /** Error reason if the number is invalid and complete or malformed. */
    errorReason?: PhoneValidationErrorReason;
}

/**
 * Checks whether a digit string contains an ascending or descending sequential run.
 *
 * @param digits - Digit string to test.
 * @param runLength - Minimum consecutive sequential run length to trigger detection (default: 5).
 * @returns True if a sequential run of at least `runLength` digits is found.
 *
 * @example
 * hasSequentialRun("123456789", 5) // true
 * hasSequentialRun("987654321", 5) // true
 * hasSequentialRun("719384620", 5) // false
 */
export function hasSequentialRun(digits: string, runLength = 5): boolean {
    if (digits.length < runLength) return false;

    let ascCount = 1;
    let descCount = 1;

    for (let i = 1; i < digits.length; i++) {
        const prev = parseInt(digits[i - 1], 10);
        const curr = parseInt(digits[i], 10);

        if (curr === prev + 1) {
            ascCount++;
            descCount = 1;
            if (ascCount >= runLength) return true;
        } else if (curr === prev - 1) {
            descCount++;
            ascCount = 1;
            if (descCount >= runLength) return true;
        } else {
            ascCount = 1;
            descCount = 1;
        }
    }

    return false;
}

/**
 * Checks whether a digit string has excessive repeated consecutive digits.
 *
 * @param digits - Digit string to test.
 * @param maxConsecutive - Maximum allowed consecutive identical digits (default: 4).
 * @returns True if more than `maxConsecutive` identical digits appear consecutively.
 *
 * @example
 * hasExcessiveRepetition("000000", 4) // true
 * hasExcessiveRepetition("11111", 4) // true
 * hasExcessiveRepetition("123456", 4) // false
 */
export function hasExcessiveRepetition(digits: string, maxConsecutive = 4): boolean {
    const regex = new RegExp(`(.)\\1{${maxConsecutive},}`);
    return regex.test(digits);
}

/**
 * Checks whether a subscriber number contains obvious cyclic repeating patterns
 * like 2-digit pairs repeated continuously (e.g. 121212121) or 3-digit triplets (e.g. 123123123).
 *
 * @param subscriber - The 9-digit subscriber portion after the '09' prefix.
 * @returns True if an alternating or cycling pattern is detected.
 */
export function hasRepeatingPattern(subscriber: string): boolean {
    // 2-digit repeated pairs (e.g. "121212121", "010101010")
    if (/^(\d{2})\1{3,}/.test(subscriber)) {
        return true;
    }

    // 3-digit repeated triplets (e.g. "123123123")
    if (/^(\d{3})\1{2}$/.test(subscriber)) {
        return true;
    }

    return false;
}

/**
 * Validates a Philippine mobile number against length, prefix, telco allocation,
 * sequential runs, repetition, entropy, and troll patterns.
 *
 * @param phone - Raw phone number string entered by the user.
 * @returns A {@link PhoneValidationResult} object containing validity status and error details.
 */
export function validatePhMobileNumber(phone: string): PhoneValidationResult {
    const clean = phone.replace(/\D/g, "");

    // Check incomplete length
    if (clean.length < 11) {
        return { isValid: false, errorReason: "incomplete" };
    }

    // Must start with "09"
    if (!clean.startsWith("09")) {
        return { isValid: false, errorReason: "invalidStart" };
    }

    // First 4 digits must match an NTC-allocated mobile prefix
    const prefix = clean.slice(0, 4);
    if (!VALID_PH_MOBILE_PREFIXES.has(prefix)) {
        return { isValid: false, errorReason: "invalidPrefix" };
    }

    const subscriber = clean.slice(2); // 9 subscriber digits after "09"

    // Check for sequential runs in either full number or subscriber portion (e.g. 09123456789, 09987654321)
    if (hasSequentialRun(clean, 5) || hasSequentialRun(subscriber, 5)) {
        return { isValid: false, errorReason: "sequential" };
    }

    // Check for 5 or more consecutive identical digits (e.g. 09170000000, 09111111111)
    if (hasExcessiveRepetition(clean, 4)) {
        return { isValid: false, errorReason: "repeated" };
    }

    // Check for cyclic repeating patterns (e.g. 09121212121, 09123123123)
    if (hasRepeatingPattern(subscriber)) {
        return { isValid: false, errorReason: "trollPattern" };
    }

    // Check entropy: genuine 11-digit phone numbers have at least 4 unique digits
    const uniqueDigits = new Set(clean.split(""));
    if (uniqueDigits.size < 4) {
        return { isValid: false, errorReason: "lowEntropy" };
    }

    return { isValid: true };
}

/**
 * Evaluates whether an on-screen keypad digit tap is valid for insertion.
 *
 * Enforces the Philippine standard at the point of entry:
 * - Digit 1: Only '0' (or '9' which auto-expands to '09') is accepted.
 * - Digit 2: Only '9' is accepted after a leading '0'.
 * - Digits 3-11: Any digit is permitted up to 11 digits max.
 *
 * @param currentPhone - The current phone number string.
 * @param nextDigit - The digit tapped on the keypad.
 * @returns The transformed next phone string if valid, or null if the digit should be rejected.
 */
export function getNextPhoneValue(currentPhone: string, nextDigit: string): string | null {
    if (currentPhone.length >= 11) {
        return null;
    }

    // Entry when input is empty
    if (currentPhone.length === 0) {
        if (nextDigit === "0") {
            return "0";
        }
        // Helpful shortcut: if patient taps '9' first, prepend '0' so it becomes '09'
        if (nextDigit === "9") {
            return "09";
        }
        return null;
    }

    // Entry when only '0' has been typed
    if (currentPhone.length === 1 && currentPhone === "0") {
        if (nextDigit === "9") {
            return "09";
        }
        return null;
    }

    // Remaining digits (2 through 10 index)
    return currentPhone + nextDigit;
}
