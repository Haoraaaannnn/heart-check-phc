import { createClient } from "@/lib/supabase/server";
import KioskServicesGrid from "@/app/kiosk/kiosk-services/components/KioskServicesGrid";
import { Service } from "@/types/Services"

export default async function KioskPage({searchParams,}: {searchParams: Promise<{type?:string}>;}) {
  const supabase = await createClient();
  const { type } = await searchParams;

  // fetch the data from supabase
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  // filter services based on the type of patient
  const visibleServices = services?.filter((service: Service) => {
    if (type === "new") return service.patient_type === "new" || service.patient_type === "both";
    if (type === "old") return service.patient_type === "old" || service.patient_type === "both";
    return true;
  }) ?? [];

  const patientType = type === "new" || type === "old" ? type : undefined;

  return (
    <KioskServicesGrid services={visibleServices} patientType={patientType} />
  );
}