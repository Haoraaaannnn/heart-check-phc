import { createClient } from "@/lib/supabase/server";
import ServiceCard from "@/app/kiosk/kiosk-services/components/KioskServicesCard";
import { Service } from "@/types/Services"

export default async function KioskPage({searchParams,}: {searchParams: Promise<{type?:string}>;}) {
  const supabase = await createClient();
  const { type } = await searchParams;

  // fetch the data from supabase
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  // created a variable where in it filters the services based on the type of patient
  const visibleServices = services?.filter((service: Service) => {
    if (type === "new") return service.patient_type === "new" || service.patient_type === "both";
    if (type === "old") return service.patient_type === "old" || service.patient_type === "both";
    return true;
  });

  // render the services in a grid
  return (
    <div className="grid grid-cols-2 w-full max-w-full landscape:grid-cols-2 content-evenly gap-x-8 gap-y-8 px-8 py-8">
      {visibleServices?.map((service: Service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}