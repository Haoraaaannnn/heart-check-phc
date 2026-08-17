import { createClient } from "@/lib/supabase/server";
import CubicleCard from "@/app/kiosk/kiosk-cubicle-selection/components/CubicleCard";
import { CubicleSelectorType } from "@/app/kiosk/kiosk-cubicle-selection/types/CubicleSelectorType";

interface Props {
  searchParams: Promise<{
    serviceId?: string;
    type?: string;
    subcategory?: string;
  }>;
}

export default async function KioskCubicleSelectionPage({ searchParams }: Props) {
    const { serviceId, type, subcategory } = await searchParams;
    const supabase = await createClient();

    const { data: cubicles, error } = await supabase
        .from("cubicle_selector")
        .select(`
            *,
            cubicles:cubicle_selector_cubicle(
                cubicle:cubicle!cubicle_selector_cubicle_cubicle_id_fkey(
                "cubicleNum",
                category,
                subcategory
                )
            )
            `)
        .order("cubicle_order", { ascending: true });

    console.log(
        "CUBICLE_SELECTOR_DEBUG",
        JSON.stringify(cubicles, null, 2)
    );

    if (error) {
        console.log("CUBICLE_SELECTOR_ERROR", error);
    }

    return (
        <div className="grid grid-cols-2 w-full max-w-full landscape:grid-cols-2 content-evenly gap-x-8 gap-y-8 px-8 py-8">
            {cubicles?.map((cubicle: CubicleSelectorType) => (
            <CubicleCard
            key={cubicle.id}
            cubicle={cubicle}
            serviceId={serviceId}
            patientType={type}
            subcategory={subcategory}
            />
            ))}
        </div>
    );
}