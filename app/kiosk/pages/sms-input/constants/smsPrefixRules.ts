/**
 * @file smsPrefixRules.ts
 * @description Centralized ticket prefix definitions and numeric queue rules for SMS phone entry.
 *
 * Defines service ticket prefix rules, prefix characters, and queue number partitioning strategies
 * when generating patient queue numbers during the kiosk check-in flow.
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
     * The ticket prefix string (e.g., "1", "2").
     */
    prefix: string;

    /**
     * Whether the ticket counter sequence is partitioned per subcategory.
     */
    groupBySubcategory: boolean;
}

/**
 * Rules for numeric prefix resolution and subcategory grouping.
 * Evaluated in sequential order; the first matching rule takes precedence.
 *
 * @remarks
 * For OPD Screening:
 * - Adult subcategory receives prefix "1" (e.g., 1001, 1002) grouped by subcategory.
 * - Pedia subcategory receives prefix "2" (e.g., 2001, 2002) grouped by subcategory.
 * - Any general or unassigned OPD Screening falls back to prefix "1" without subcategory grouping.
 */
export const NUMERIC_PREFIX_RULES: readonly NumericPrefixRule[] = [
    {
        match: (name, subcategory) =>
            name === "OPD Screening" &&
            (subcategory === "Adult" || subcategory?.toLowerCase() === "adult"),
        prefix: "1",
        groupBySubcategory: true,
    },
    {
        match: (name, subcategory) =>
            name === "OPD Screening" &&
            (subcategory === "Pedia" || subcategory?.toLowerCase() === "pedia"),
        prefix: "2",
        groupBySubcategory: true,
    },
    {
        match: (name) => name === "OPD Screening",
        prefix: "1",
        groupBySubcategory: false,
    },
];

/**
 * Fallback service prefix characters mapped by service English label.
 *
 * @remarks
 * Used when a service does not match any specialized numeric prefix rule.
 * Defaults to "C" (Consultation) if an unregistered service is encountered.
 */
export const SMS_SERVICE_PREFIXES: Record<string, string> = {
    "Consultation": "C",
    "OPD Screening": "1",
    "OPD Card": "OC",
    "Refill Prescription": "R",
    "ECG": "E",
    "Warfarin": "W",
    "OPD Reschedule": "RS",
    "Benzathine": "B",
};
