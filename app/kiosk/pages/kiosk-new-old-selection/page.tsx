import { createClient } from "@/lib/supabase/server";
import PatientTypeCard from "@/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeCards";
import { PatientCategory } from "@/app/kiosk/pages/kiosk-new-old-selection/types/PatientType";
import { KioskNewOldClasses } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOld";

/**
 * Kiosk entrance page for patient category selection (`/kiosk/pages/kiosk-new-old-selection`).
 *
 * Server component that fetches patient category types from the `patient_category` table
 * and displays them in their configured display order.
 *
 * @remarks
 * Choosing a category sets the `type` query parameter (e.g. `type=new` or `type=old`)
 * which cascades into subsequent service filtering on `/kiosk/pages/kiosk-services`.
 *
 * @returns The grid of patient category options.
 */
export default async function KioskNewOldSelectionPage() {
    const supabase = await createClient();

    // Query categories in the order defined by administrators.
    const { data: patientTypes } = await supabase
        .from("patient_category")
        .select("*")
        .order("order", { ascending: true });

    return (
        <div className={KioskNewOldClasses.grid}>
            {patientTypes?.map((category: PatientCategory) => (
                <PatientTypeCard key={category.id} patientCategory={category} />
            ))}
        </div>
    );
}