/**
 * Represents a patient category row from the `patient_category` table in Supabase.
 *
 * Used on the kiosk welcome / patient type selection screen (`/kiosk/pages/kiosk-new-old-selection`)
 * to determine whether a patient is a new patient ("new") or an existing/returning patient ("old").
 */
export type PatientCategory = {
    /** Primary numeric identity of the category record. */
    id: number;
    /** English label displayed on the secondary badge/pill (e.g., "New Patient"). */
    label_en: string;
    /** Filipino primary label displayed prominently on the card (e.g., "Bagong Pasyente"). */
    label_fil: string;
    /** Boxicons class name or legacy icon name resolved dynamically at render time (e.g., "bx-user-plus"). */
    icon_src: string;
    /** Display sequence order configured by administrators. */
    order: number;
    /** The patient type discriminator: "new" for first-time registration or "old" for returning visits. */
    type: "new" | "old";
};