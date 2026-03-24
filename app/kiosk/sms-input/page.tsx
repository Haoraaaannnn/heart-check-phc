import { createClient } from "@/lib/supabase/client";
import SMSBanner from "@/components/SMS/sms-banner";
import KioskPhoneEntry from "@/components/SMS/sms-entry";
import SMSInstruction from "@/components/SMS/sms-instruction";
import { notFound } from "next/navigation";

// 1. Change Props to use searchParams instead of params
interface Props {
    searchParams: Promise<{ serviceId?: string }>;
}

export default async function SMSPage({ searchParams }: Props) {
    // 2. Await searchParams (Next.js 15 requirement)
    const { serviceId } = await searchParams;
    const supabase = await createClient();

    // 3. Use the same parsing logic as your working page
    const { data: service, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", parseInt(serviceId ?? "0", 10))
        .single();

    if (!service || error) {
        console.error("Fetch error:", error);
        notFound();
    }

    return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
        
        {/* 2. Top Content: Banner and Instructions stay at the top */}
        <div className="flex-none">
            <SMSBanner service={service} />
            <SMSInstruction service={service}/>
        </div>

        {/* 3. Flexible Middle: The PhoneEntry (Input + NumPad) takes the remaining space */}
        <div className="flex-1 flex flex-col">
            <KioskPhoneEntry service={service}/>
        </div>

    </div>
    );
}