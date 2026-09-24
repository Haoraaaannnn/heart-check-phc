import { createClient } from "@/lib/supabase/server";
import CubicleCard from "@/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCard";
import { CubicleSelectorType } from "@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType";
import { getTimestamp } from "@/lib/logger";

/** Props Next.js passes to the cubicle selection page. */
interface KioskCubicleSelectionPageProps {
    /**
     * URL query parameters (Promise in Next.js 15).
     */
    searchParams: Promise<{
        serviceId?: string;
        type?: string;
        subcategory?: string;
    }>;
}

/**
 * Kiosk cubicle selection page (`/kiosk/pages/kiosk-cubicle-selection`).
 *
 * Server component that queries `cubicle_selector` records joined with their
 * linked physical cubicles and presents them for patient selection.
 *
 * @param props - Page props provided by Next.js.
 * @returns The grid of cubicle selector options.
 */
export default async function KioskCubicleSelectionPage({
    searchParams,
}: KioskCubicleSelectionPageProps) {
    const { serviceId, type, subcategory } = await searchParams;
    const supabase = await createClient();

    // Fetch cubicle selector groupings ordered by administrative sequence.
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

    if (error) {
        console.error(`${getTimestamp()} [CUBICLE SELECTOR ERROR]:`, error);
    }

    return (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 landscape:grid-cols-3 gap-6 px-6 py-6">
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