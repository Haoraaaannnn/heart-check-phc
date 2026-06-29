import { createClient } from "@/lib/supabase/server";
import ServiceBanner from "@/app/kiosk/confirmation/components/ConfirmationBanner";
import ConfirmationActions from "@/app/kiosk/confirmation/components/ConfirmationButton";
import ConfirmationDescriptions from "@/app/kiosk/confirmation/components/ConfimationDescription";
import type { Service } from "@/types/Services";

interface Props {
  searchParams?: { serviceId?: string };
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { serviceId } = await searchParams ?? {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", parseInt(serviceId ?? "0", 10))
    .single();

  const service: Service = data;

  return (

    <div className="h-full flex flex-col w-full bg-white overflow-hidden">
      
      <div className="shrink-0">
        <ServiceBanner service={service} />
      </div>

      
      <div className="flex-1 flex flex-col justify-center px-10 py-6 min-h-0 overflow-hidden">
        <ConfirmationDescriptions service={service} descColor={service.bg_color} />
      </div>

      <div className="shrink-0 px-10 pb-12 pt-4 w-full">
        <ConfirmationActions serviceId={service.id} serviceColor={service.bg_color}/>
      </div>
      
    </div>
  );
}