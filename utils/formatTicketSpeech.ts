/**
 * @fileoverview Queue ticket audio announcement speech formatter.
 *
 * Converts raw database patient queue codes (e.g. "8002", "5001", "1001", "C001", "C-101")
 * into clear, digit-by-digit and character-by-character spoken character sequences for
 * Text-to-Speech (TTS) announcement engines (Deepgram Aura and Web Speech API).
 *
 * Character-by-character formatting ensures speech engines vocalize numbers digit-by-digit
 * (e.g., "5 0 0 1" -> "five zero zero one", rather than grouping into "five thousand one").
 *
 * Handles:
 * 1. 4-digit pure numeric sequence codes across all clinic services:
 *    - OPD Screening: 1001 series -> "1 0 0 1"
 *    - Consultation (Pedia): 2001 series -> "2 0 0 1"
 *    - ECG: 3001 series -> "3 0 0 1"
 *    - OPD Card: 4001 series -> "4 0 0 1"
 *    - Consultation (Adult): 5001 series -> "5 0 0 1"
 *    - Refill Prescription: 6001 series -> "6 0 0 1"
 *    - Warfarin: 7001 series -> "7 0 0 1"
 *    - OPD Reschedule: 8001 series -> "8 0 0 2"
 *    - Benzathine: 9001 series -> "9 0 0 1"
 * 2. Alphanumeric prefixed codes (e.g. "C001" -> "C 0 0 1", "C-101" -> "C 1 0 1").
 *
 * Architectural Context:
 * Previously, code split the ticket using `num.charAt(0)` and `parseInt(num.slice(1), 10)`.
 * For pure numeric tickets like "8002", this produced letter "8" and digits "2", resulting in
 * "Number 8 2" (announced as eighty-two) instead of the actual queue number 8002.
 * Subsequently, passing raw numbers like "5001" caused TTS engines to synthesize "five thousand one".
 * This character-spaced formatter ensures each digit and letter is articulated individually ("5 0 0 1").
 *
 * @module utils/formatTicketSpeech
 */

/**
 * Formats a patient queue ticket identifier for digit-by-digit voice synthesis.
 *
 * @param patientNum - Raw queue ticket code (e.g. "8002", "5001", "C001", "C-101").
 * @returns Formatted character-separated string for TTS dispatch (e.g. "8 0 0 2", "5 0 0 1", "C 0 0 1").
 *
 * @example
 * formatTicketForSpeech("5001"); // "5 0 0 1"
 * formatTicketForSpeech("8002"); // "8 0 0 2"
 * formatTicketForSpeech("1001"); // "1 0 0 1"
 * formatTicketForSpeech("C001"); // "C 0 0 1"
 * formatTicketForSpeech("C-101"); // "C 1 0 1"
 */
export function formatTicketForSpeech(patientNum?: string | null): string {
  if (!patientNum) return '';
  const trimmed = patientNum.trim();
  if (!trimmed) return '';

  // Strip punctuation, hyphens, and internal whitespace
  const clean = trimmed.replace(/[^a-zA-Z0-9]/g, '');
  if (!clean) return trimmed;

  // Space-separate each character so TTS engines pronounce each character individually
  return clean.toUpperCase().split('').join(' ');
}
