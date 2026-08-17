import { createClient } from "@/lib/supabase/server";
import CubicleCard from "@/app/kiosk/kiosk-cubicle-selection/components/CubicleCard";
import { CubicleSelectorType } from "@/app/kiosk/kiosk-cubicle-selection/types/CubicleSelectorType";

interface Props {
    searchParams: Promise<{ serviceId?: string; type?: string; serviceColor?: string }>;
}

export default async function KioskCubicleSelectionPage({ searchParams }: Props) {
    const { serviceId, type, serviceColor } = await searchParams;
    const supabase = await createClient();

    const { data: cubicles } = await supabase
        .from("cubicle_selector")
        .select("*")
        .order("cubicle_order", { ascending: true });

    return (
        <div className="grid grid-cols-2 w-full max-w-full landscape:grid-cols-2 content-evenly gap-x-8 gap-y-8 px-8 py-8">
            {cubicles?.map((cubicle: CubicleSelectorType) => (
                <CubicleCard
                    key={cubicle.id}
                    cubicle={cubicle}
                    serviceId={serviceId}
                    serviceColor={serviceColor}
                    patientNum={type}
                />
            ))}
        </div>
    );
}