import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Service } from "@/types/Services";
import QueuePrintContent from "@/app/kiosk/pages/queue-print/components/QueuePrintContent";

/** Props Next.js passes to the ticket printing confirmation page. */
interface QueuePrintPageProps {
    /** URL query parameters (Promise in Next.js 15). */
    searchParams: Promise<{
        patientNum?: string;
        serviceId?: string;
        cubicleNum?: string;
    }>;
}

/**
 * Queue ticket printing confirmation page (`/kiosk/pages/queue-print`).
 *
 * Server component that fetches service details for the created queue ticket
 * and renders the confirmation card that initiates physical printing.
 *
 * @param props - Page props provided by Next.js.
 * @returns The rendered print confirmation view.
 */
export default async function QueuePrintPage({ searchParams }: QueuePrintPageProps) {
    const { patientNum = "---", serviceId, cubicleNum = "---" } = await searchParams;
    const supabase = await createClient();

    let service: Service | null = null;

    if (serviceId) {
        const { data } = await supabase
            .from("services")
            .select("*")
            .eq("id", parseInt(serviceId, 10))
            .single();
        service = data;
    }

    if (!service) {
        notFound();
    }

    return (
        <QueuePrintContent
            service={service}
            patientNum={patientNum}
            cubicleNum={cubicleNum}
        />
    );
}
