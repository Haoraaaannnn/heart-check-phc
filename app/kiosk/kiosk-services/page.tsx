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
    /* THE FIX: 
       Added `landscape:grid-cols-4`.
       In Portrait: 2 columns, 4 rows.
       In Landscape: 4 columns, 2 rows. 
    */
    <div className="grid grid-cols-2 landscape:grid-cols-4 h-full content-evenly gap-x-8 gap-y-6 px-8 pb-12 pt-4">
      {services?.map((service: Service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}