import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
 * @remarks
 * **Access Control Guard:**
 * Cubicle selection is strictly restricted to Consultation patients.
 * If accessed without a `serviceId` or for a non-consultation service (such as
 * OPD Screening), patients are automatically redirected to the appropriate
 * downstream screen (`sms-input` or `kiosk-services`).
 *
 * @param props - Page props provided by Next.js.
 * @returns The grid of cubicle selector options.
 */
export default async function KioskCubicleSelectionPage({
    searchParams,
}: KioskCubicleSelectionPageProps) {
    const { serviceId, type, subcategory } = await searchParams;
    const supabase = await createClient();

    // Guard: Require serviceId; otherwise redirect to service catalog
    if (!serviceId) {
        redirect(
            type
                ? `/kiosk/pages/kiosk-services?type=${encodeURIComponent(type)}`
                : "/kiosk/pages/kiosk-services"
        );
    }

    // Fetch active service to verify eligibility for cubicle selection
    const { data: service } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId, 10))
        .single();

    const serviceLabel = service?.label_en?.trim().toLowerCase();

    // Guard: Cubicle selection is strictly restricted to Consultation.
    // If accessed for OPD Screening or any other service, redirect to SMS input.
    if (!service || serviceLabel !== "consultation") {
        const params = new URLSearchParams();
        if (serviceId) params.set("serviceId", serviceId);
        if (type) params.set("type", type);
        if (subcategory) params.set("subcategory", subcategory);
        redirect(`/kiosk/pages/sms-input?${params.toString()}`);
    }

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