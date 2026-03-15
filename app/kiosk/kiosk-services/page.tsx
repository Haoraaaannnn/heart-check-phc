import { createClient } from "@/lib/supabase/server";
import ServiceCard from "@/components/kiosk/KioskServicesCard";
import { Service } from "@/types/Services"

export default async function KioskPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="grid grid-cols-2 gap-6 p-10">
      {services?.map((service: Service)=>(
        <ServiceCard key = {service.id} service={service}/>
      ))}
    </div>
  );
}
