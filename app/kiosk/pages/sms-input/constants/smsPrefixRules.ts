/**
 * @file smsPrefixRules.ts
 * @description Centralized ticket prefix definitions and numeric queue rules for SMS phone entry.
 *
 * Defines service ticket prefix rules, prefix characters, and queue number partitioning strategies
 * when generating patient queue numbers during the kiosk check-in flow.
 *
 * Full numeric prefix scheme (all services use integer-safe prefixes):
 *   1xxx  -  OPD Screening (all subcategories, unified sequence)
 *   2xxx  -  Consultation, Pedia subcategory
 *   3xxx  -  ECG
 *   4xxx  -  OPD Card
 *   5xxx  -  Consultation, Adult subcategory
 *   6xxx  -  Refill Prescription
 *   7xxx  -  Warfarin
 *   8xxx  -  OPD Reschedule
 *   9xxx  -  Benzathine
 */

/**
 * Rule contract for matching a service and optional subcategory to a ticket prefix.
 */
export interface NumericPrefixRule {
    /**
     * Predicate function checking if the rule matches the given service name and subcategory.
     *
     * @param name - The English label of the service (e.g. "OPD Screening").
     * @param subcategory - The optional subcategory (e.g. "Adult" or "Pedia").
     * @returns True if the rule conditions are met.
     */
    match: (name: string, subcategory?: string) => boolean;

    /**
     * The ticket prefix string (e.g., "1", "2", "3").
     */
    prefix: string;

    /**
     * Whether the ticket counter sequence is partitioned per subcategory inside the DB function.
     *
     * @remarks
     * Set to true only when two different subcategories share the same prefix and must
     * maintain independent counters. When each subcategory already has a distinct prefix
     * (e.g. Pedia = 2, Adult = 5) this flag should be false because the prefix itself
     * already isolates the sequences.
     */
    groupBySubcategory: boolean;
}

/**
 * Priority-ordered rules for numeric prefix and subcategory grouping resolution.
 *
 * @remarks
 * Rules are evaluated in array order; the first match wins.
 *
 * Scheme:
 * - OPD Screening (any or no subcategory)  ->  prefix "1"  (1001, 1002 ...)
 * - Consultation Pedia                      ->  prefix "2"  (2001, 2002 ...)
 * - ECG                                     ->  prefix "3"  (3001, 3002 ...)
 * - Consultation Adult                      ->  prefix "5"  (5001, 5002 ...)
 */
export const NUMERIC_PREFIX_RULES: readonly NumericPrefixRule[] = [
    // OPD Screening: all subcategories share a single "1" sequence.
    {
        match: (name) => name.toLowerCase() === "opd screening",
        prefix: "1",
        groupBySubcategory: false,
    },
    // Consultation Pedia: dedicated "2" sequence.
    {
        match: (name, subcategory) =>
            name.toLowerCase() === "consultation" &&
            subcategory?.toLowerCase() === "pedia",
        prefix: "2",
        groupBySubcategory: false,
    },
    // ECG: dedicated "3" sequence, no subcategory.
    {
        match: (name) => name.toLowerCase() === "ecg",
        prefix: "3",
        groupBySubcategory: false,
    },
    // Consultation Adult: dedicated "5" sequence.
    {
        match: (name, subcategory) =>
            name.toLowerCase() === "consultation" &&
            subcategory?.toLowerCase() === "adult",
        prefix: "5",
        groupBySubcategory: false,
    },
];

/**
 * Numeric fallback prefix strings mapped by service English label.
 *
 * @remarks
 * Used only when a service does not match any rule in {@link NUMERIC_PREFIX_RULES}.
 * All values are pure digit strings so the DB `create_patient` function can safely
 * operate on the generated ticket numbers without integer-cast errors.
 *
 * Services handled by {@link NUMERIC_PREFIX_RULES} (OPD Screening, Consultation,
 * ECG) are intentionally absent here so they never silently fall back to this map.
 */
export const SMS_SERVICE_PREFIXES: Record<string, string> = {
    "OPD Card": "4",
    "Refill Prescription": "6",
    "Warfarin": "7",
    "OPD Reschedule": "8",
    "Benzathine": "9",
};
