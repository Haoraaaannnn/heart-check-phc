import { createClient } from "@/lib/supabase/client";
import SMSBanner from "@/components/SMS/sms-banner";
import KioskPhoneEntry from "@/components/SMS/sms-entry";
import { notFound } from "next/navigation";

interface Props {
    searchParams: Promise<{ serviceId?: string }>;
}

export default async function SMSPage({ searchParams }: Props) {
    const { serviceId } = await searchParams;
    const supabase = await createClient();

    const { data: service, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId ?? "0", 10))
        .single();

    if (!service || error) notFound();

    return (
      // Using larger padding on big screens (lg:p-12) to keep it from touching the absolute edges
      <div className="w-full h-[100dvh] flex flex-col overflow-hidden bg-white items-center p-4 md:p-8 lg:p-12">
        
        {/* THE FIX: Removed max-w-7xl. Now it uses w-full to stretch 100% across 1920px screens! */}
        <div className="flex flex-col w-full h-full gap-4 md:gap-8 lg:gap-10">
            
            <div className="flex-none">
                <SMSBanner service={service} />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <KioskPhoneEntry service={service}/>
            </div>

        </div>
      </div>
    );
}