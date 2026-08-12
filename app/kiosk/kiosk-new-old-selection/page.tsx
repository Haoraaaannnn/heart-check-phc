import { createClient } from "@/lib/supabase/server";
import PatientTypeCard from "@/app/kiosk/kiosk-new-old-selection/components/PatientTypeCards";
import { PatientCategory } from "@/app/kiosk/kiosk-new-old-selection/types/PatientType";

export default async function KioskNewOldSelectionPage() {
    const supabase = await createClient();

    const { data: patientTypes } = await supabase
        .from("patient_category")
        .select("*")
        .order("order", { ascending: true });

    return (
        <div className="grid grid-cols-2 w-full max-w-full landscape:grid-cols-2 content-evenly gap-x-8 gap-y-8 px-8 py-8">
            {patientTypes?.map((pt: PatientCategory) => (
                <PatientTypeCard key={pt.id} patientCategory={pt} />
            ))}
        </div>
    );
}