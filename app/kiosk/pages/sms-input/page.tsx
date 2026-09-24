import { createClient } from "@/lib/supabase/server";
import SMSBanner from "@/app/kiosk/pages/sms-input/components/SMSBanner";
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

    // Query active service to display on the top banner
    const { data: service, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId ?? "0", 10))
        .single();

    if (!service || error) {
        notFound();
    }

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-white p-0">
            <div className="flex flex-col w-full h-full gap-2 md:gap-4 overflow-hidden">
                {/* Service Brand Banner */}
                <div className="flex-none">
                    <SMSBanner service={service} />
                </div>

                {/* Keypad and Phone Entry Area */}
                <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
                    <KioskPhoneEntry
                        service={service}
                        patientNum={patientNum}
                        preferredCubicleNums={preferredCubicleNums}
                        subcategory={subcategory}
                    />
                </div>
            </div>
        </div>
    );
}