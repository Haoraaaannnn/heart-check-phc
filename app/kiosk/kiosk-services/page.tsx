import { createClient } from "@/lib/supabase/server";
import ServiceCard from "@/app/kiosk/kiosk-services/components/KioskServicesCard";
import { Service } from "@/types/Services"

export default async function KioskPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="grid grid-cols-1 w-full max-w-full landscape:grid-cols-2 content-evenly gap-x-8 gap-y-8 px-8 py-8">
      {services?.map((service: Service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}