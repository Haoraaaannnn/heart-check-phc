import { createClient } from "@/lib/supabase/client";
import SMSBanner from "@/app/kiosk/sms-input/components/SMSBanner";
import KioskPhoneEntry from "@/app/kiosk/sms-input/components/KioskPhoneEntry";
import { notFound } from "next/navigation";

interface Props {
    searchParams: Promise<{ serviceId?: string; patientNum?: string; serviceColor?: string }>;
}

export default async function SMSPage({ searchParams }: Props) {
    const { serviceId, patientNum, serviceColor } = await searchParams;
    const supabase = await createClient();

    const { data: service, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId ?? "0", 10))
        .single();

    if (!service || error) notFound();

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-white p-0">
            <div className="flex flex-col w-full h-full gap-2 md:gap-4 lg:gap-6 portrait:lg:gap-8 landscape:lg:gap-3 landscape:2xl:gap-8 overflow-hidden">
                
                <div className="flex-none">
                    <SMSBanner service={service} />
                </div>

                <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
                    <KioskPhoneEntry service={service} patientNum={patientNum} />
                </div>

            </div>
        </div>
    );
}