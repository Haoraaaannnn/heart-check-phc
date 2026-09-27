import { createClient } from "@/lib/supabase/server";
import ServiceBanner from "@/app/kiosk/pages/confirmation/components/ConfirmationBanner";
import ConfirmationActions from "@/app/kiosk/pages/confirmation/components/ConfirmationActions";
import ConfirmationDescriptions from "@/app/kiosk/pages/confirmation/components/ConfimationDescription";
import { ConfirmationLayoutTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationLayoutTexts";
import { ConfirmationLayoutClasses } from "@/app/kiosk/pages/confirmation/constants/confirmationLayout";
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
            <div className={ConfirmationLayoutClasses.pageNoService}>
                {ConfirmationLayoutTexts.noService}
            </div>
        );
    }

    const service: Service = data;
    const patientType = type === "new" || type === "old" ? type : undefined;

    return (
        <div className={ConfirmationLayoutClasses.pageContainer}>
            <div className={ConfirmationLayoutClasses.pageBannerWrapper}>
                <ServiceBanner service={service} />
            </div>

            <div className={ConfirmationLayoutClasses.pageDescriptionsWrapper}>
                <ConfirmationDescriptions service={service} />
            </div>

            <div className={ConfirmationLayoutClasses.pageActionsWrapper}>
                <ConfirmationActions service={service} patientType={patientType} />
            </div>
        </div>
    );
}