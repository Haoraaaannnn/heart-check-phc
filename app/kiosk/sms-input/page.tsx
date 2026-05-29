import { createClient } from "@/lib/supabase/client";
import SMSBanner from "@/components/SMS/sms-banner";
import KioskPhoneEntry from "@/components/SMS/sms-entry";
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
      <div className="w-full h-[100dvh] flex flex-col overflow-hidden bg-white items-center p-4 md:p-8 lg:p-10 portrait:lg:p-12 landscape:lg:p-8 landscape:2xl:p-12">
        

        <div className="flex flex-col w-full h-full gap-2 md:gap-4 lg:gap-6 portrait:lg:gap-8 landscape:lg:gap-3 landscape:2xl:gap-8\">
            
            <div className="flex-none">
                <SMSBanner service={service} />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <KioskPhoneEntry service={service} patientNum={patientNum} />
            </div>

        </div>
      </div>
    );
}