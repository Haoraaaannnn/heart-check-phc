/**
 * Cubicle details joined from the `cubicle` table.
 */
export type ActualCubicle = {
    /** Assigned cubicle identifier/number (e.g. "Cubicle 1", "Room 6-A"). */
    cubicleNum: string;
    /** Service category for this cubicle (e.g. "Consultation"). */
    category: string;
    /** Age subcategory assigned to this cubicle ("Adult", "Pedia", or null if unassigned). */
    subcategory: string | null;
};

/**
 * Represents a selectable cubicle group or station on the kiosk.
 *
 * Mapped to the `cubicle_selector` table and linked to real physical cubicles
 * via `cubicle_selector_cubicle`.
 */
export type CubicleSelectorType = {
    /** Primary numeric identity of the cubicle selector group. */
    id: number;
    /** Display name shown on the kiosk card (e.g., "Cubicle 1-4", "Dr. Cruz"). */
    cubicle_name: string;
    /** Display sequence order configured by administrators. */
    cubicle_order: number;
    /** Associated cubicles linked to this selector option. */
    cubicles?: {
        cubicle: ActualCubicle | null;
    }[];
};