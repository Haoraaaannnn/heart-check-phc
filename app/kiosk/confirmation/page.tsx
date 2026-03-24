import { supabase } from "@/lib/supabase";
import ServiceBanner from "@/components/confirmation/ConfirmationBanner";
import ConfirmationActions from "@/components/confirmation/ConfirmationAction";
import ConfirmationDescriptions from "@/components/confirmation/ConfimationDescription";
import type { Service } from "@/types/Services";

interface Props {
  searchParams?: { serviceId?: string };
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { serviceId } = await searchParams ?? {};
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", parseInt(serviceId ?? "0", 10))
    .single();

  const service: Service = data;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <ServiceBanner service={service} />
        <ConfirmationDescriptions service={service} />
      </div>
      <ConfirmationActions serviceId={service.id} />
    </div>
  );
}