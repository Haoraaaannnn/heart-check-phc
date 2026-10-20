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

    /**
     * Whether the patient must check in at Registration Counters 1 to 5
     * for document verification and initial triage before continuing.
     */
    requires_registration?: boolean | null;

    /**
     * Whether the kiosk prompts the patient for Adult (19+) vs Pedia (18 and below)
     * age bracket triage before continuing.
     */
    has_subcategories?: boolean | null;

    /**
     * Whether the kiosk displays doctor and cubicle selection cards,
     * routing patients to physical examination rooms.
     */
    requires_cubicle?: boolean | null;

    /**
     * Whether this service appears on the 3-stage Nurse Station Kanban
     * point-of-care workstation (/nurse: Assigned -> With Doctor -> Carryout -> Done).
     */
    requires_nurse?: boolean | null;

    /**
     * Whether this service queue is broadcast on public TV monitors in waiting areas.
     */
    show_on_monitor?: boolean | null;

    /**
     * Whether the transfer coordinator automatically distributes waiting patients
     * to available stations FIFO without staff manual drag-and-drop.
     */
    auto_assign?: boolean | null;

    /**
     * TV monitor calling layout style: 'cubicle' for paired doctor card split-screen,
     * or 'table' for multi-patient matrix grid.
     */
    monitor_layout?: 'cubicle' | 'table' | string | null;
};