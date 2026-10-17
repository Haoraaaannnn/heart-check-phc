/**
 * @fileoverview Type definitions for hospital clinical services and kiosk catalog entries.
 *
 * @module types/Services
 */

/**
 * Represents a clinical service entry stored in the PostgreSQL `services` table.
 */
export type Service = {
    /** Unique integer identifier and primary key for the service. */
    id: number;

    /** English display label (e.g. "Consultation", "OPD Screening", "Warfarin"). */
    label_en: string;

    /** Filipino / Tagalog display label (e.g. "Pagsusuri ng Doktor", "Pagsala sa OPD"). */
    label_fil: string;

    /** Boxicons icon class name or glyph identifier (e.g. "bx-pulse", "bx-heart"). */
    icon_src: string;

    /** Display sequence order on kiosk touchscreens and selection grids. */
    display_order: number;

    /** English guidance description displayed on kiosk selection cards. */
    description_en: string;

    /** Filipino guidance description displayed on kiosk selection cards. */
    description_fil: string;

    /** Patient cohort routing classification: new patients, returning patients, or both. */
    patient_type: "new" | "old" | "both";

    /**
     * Leading character or prefix (letter or number, e.g. "C", "S", "1", "4")
     * prepended to printed queue tickets. Serves as the first number or letter
     * on the queue number.
     */
    queue_prefix?: string | null;

    /**
     * Number of zero-padded numeric digits following the prefix.
     * For example, 3 produces "001" (yielding "C001" or "1001"), while 4 produces "0001".
     */
    queue_pad_length?: number;
};