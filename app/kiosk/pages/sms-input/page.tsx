import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import KioskPhoneEntry from "@/app/kiosk/pages/sms-input/components/KioskPhoneEntry";
import { notFound } from "next/navigation";
import { getCachedServices } from "@/lib/cache/facilityMetadataCache";

/** Props Next.js passes to the SMS phone input page. */
interface SMSPageProps {
    /** URL query parameters (Promise in Next.js 15). */
    searchParams: Promise<{
        serviceId?: string;
        patientNum?: string;
        serviceColor?: string;
        preferredCubicleNums?: string;
        subcategory?: string;
        cubicleNum?: string;
    }>;
}

/**
 * Kiosk SMS phone number entry page (`/kiosk/pages/sms-input`).
 *
 * Server component that fetches the selected service details from Supabase
 * and mounts the on-screen keypad and queue registration interface.
 *
 * @param props - Page props provided by Next.js.
 * @returns The rendered SMS input screen.
 */
export default async function SMSPage({ searchParams }: SMSPageProps) {
    const { serviceId, patientNum, preferredCubicleNums, subcategory, cubicleNum } =
        await searchParams;
    const supabase = await createClient();

    // Query active service from facility cache (with automatic 3-minute TTL)
    const targetId = parseInt(serviceId ?? "0", 10);
    const services = await getCachedServices(supabase);
    let service = services.find((s) => s.id === targetId) || null;

    if (!service && targetId > 0) {
        const { data, error } = await supabase.from("services").select("*").eq("id", targetId).single();
        if (error) throw new Error('Unable to load the selected service. Please try again.');
        service = data;
    }
    if (!service) {
        notFound();
    }

    return (
        <Suspense fallback={null}>
            <KioskPhoneEntry
                service={service}
                patientNum={patientNum}
                preferredCubicleNums={preferredCubicleNums}
                subcategory={subcategory}
                cubicleNum={cubicleNum}
            />
        </Suspense>
    );
}
