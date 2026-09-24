import { createClient } from "@/lib/supabase/server";
import ServiceBanner from "@/app/kiosk/pages/confirmation/components/ConfirmationBanner";
import ConfirmationActions from "@/app/kiosk/pages/confirmation/components/ConfirmationActions";
import ConfirmationDescriptions from "@/app/kiosk/pages/confirmation/components/ConfimationDescription";
import { confirmationTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationTexts";
import type { Service } from "@/types/Services";

/** Props Next.js passes to the standalone confirmation page. */
interface ConfirmationPageProps {
    /** URL query parameters (Promise in Next.js 15). */
    searchParams?: Promise<{
        serviceId?: string;
        type?: string;
    }>;
}

/**
 * Standalone fallback page for service confirmation (`/kiosk/pages/confirmation`).
 *
 * @remarks
 * While confirmation is typically presented as an in-page modal directly on
 * `/kiosk/pages/kiosk-services`, this route serves as a standalone fallback target.
 *
 * @param props - Page props provided by Next.js.
 * @returns The full-page confirmation interface.
 */
export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
    const resolvedParams = searchParams ? await searchParams : {};
    const { serviceId, type } = resolvedParams;

    const supabase = await createClient();
    const { data } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId ?? "0", 10))
        .single();

    if (!data) {
        return (
            <div className="h-full flex items-center justify-center bg-white text-gray-500 text-xl font-medium">
                {confirmationTexts.noService}
            </div>
        );
    }

    const service: Service = data;
    const patientType = type === "new" || type === "old" ? type : undefined;

    return (
        <div className="h-full flex flex-col w-full bg-white overflow-hidden">
            <div className="shrink-0">
                <ServiceBanner service={service} />
            </div>

            <div className="flex-1 flex flex-col justify-center px-6 md:px-10 py-6 min-h-0 overflow-hidden">
                <ConfirmationDescriptions service={service} />
            </div>

            <div className="shrink-0 px-6 md:px-10 pb-12 pt-4 w-full">
                <ConfirmationActions service={service} patientType={patientType} />
            </div>
        </div>
    );
}