import { createClient } from "@/lib/supabase/server";
import KioskPhoneEntry from "@/app/kiosk/pages/sms-input/components/KioskPhoneEntry";
import { notFound } from "next/navigation";

/** Props Next.js passes to the SMS phone input page. */
interface SMSPageProps {
    /** URL query parameters (Promise in Next.js 15). */
    searchParams: Promise<{
        serviceId?: string;
        patientNum?: string;
        serviceColor?: string;
        preferredCubicleNums?: string;
        subcategory?: string;
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
    const { serviceId, patientNum, preferredCubicleNums, subcategory } =
        await searchParams;
    const supabase = await createClient();

    // Query active service to forward details to phone entry
    const { data: service, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId ?? "0", 10))
        .single();

    if (!service || error) {
        notFound();
    }

    return (
        <KioskPhoneEntry
            service={service}
            patientNum={patientNum}
            preferredCubicleNums={preferredCubicleNums}
            subcategory={subcategory}
        />
    );
}