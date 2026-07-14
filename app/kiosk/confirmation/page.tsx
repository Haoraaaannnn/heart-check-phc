import { createClient } from "@/lib/supabase/server";
import ServiceBanner from "@/app/kiosk/confirmation/components/ConfirmationBanner";
import ConfirmationActions from "@/app/kiosk/confirmation/components/ConfirmationButton";
import ConfirmationDescriptions from "@/app/kiosk/confirmation/components/ConfimationDescription";
import type { Service } from "@/types/Services";

interface Props {
  searchParams?: { serviceId?: string; type?: string };
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { serviceId, type } = await searchParams ?? {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", parseInt(serviceId ?? "0", 10))
    .single();

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-500 text-xl">
        No service selected.
      </div>
    );
  }

  const service: Service = data;
  const patientType = type === "new" || type === "old" ? type : undefined;

  return (
    <div className="h-full flex flex-col w-full bg-white overflow-hidden">
      <div className="shrink-0">
        <ServiceBanner service={service} />
      </div>

      <div className="flex-1 flex flex-col justify-center px-10 py-6 min-h-0 overflow-hidden">
        <ConfirmationDescriptions service={service} descColor={service.bg_color} />
      </div>

      <div className="shrink-0 px-10 pb-12 pt-4 w-full">
        <ConfirmationActions service={service} patientType={patientType} />
      </div>
    </div>
  );
}