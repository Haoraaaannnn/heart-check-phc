import { createClient } from "@/lib/supabase/server";
import KioskServicesGrid from "@/app/kiosk/kiosk-services/components/KioskServicesGrid";
import { Service } from "@/types/Services";

/** Props Next.js passes to the kiosk services page. */
interface KioskPageProps {
  /**
   * URL query parameters. In this Next.js version it is a Promise and
   * must be awaited before reading values.
   */
  searchParams: Promise<{
    /** Patient type chosen on the previous screen: "new" or "old". */
    type?: string;
  }>;
}

/**
 * Kiosk services page (`/kiosk/kiosk-services?type=new|old`).
 *
 * Server component that loads the service menu from the `services` table
 * and shows only the services the patient type is allowed to use.
 *
 * @remarks
 * Filtering uses `services.patient_type`:
 * - `type=new` shows services marked `new` or `both`
 * - `type=old` shows services marked `old` or `both`
 * - no or unknown type shows everything
 *
 * @param props - Page props provided by Next.js.
 * @returns The services grid, filtered for the selected patient type.
 */
export default async function KioskPage({ searchParams }: KioskPageProps) {
  const supabase = await createClient();
  const { type } = await searchParams;

  // Fetch the full service menu in the order set by the superadmin.
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  // Keep only the services this patient type is allowed to see.
  const visibleServices =
    services?.filter((service: Service) => {
      if (type === "new") return service.patient_type === "new" || service.patient_type === "both";
      if (type === "old") return service.patient_type === "old" || service.patient_type === "both";
      return true;
    }) ?? [];

  // Anything other than "new" or "old" is treated as "not provided".
  const patientType = type === "new" || type === "old" ? type : undefined;

  return (
    <KioskServicesGrid services={visibleServices} patientType={patientType} />
  );
}