import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

interface ConfirmationPageProps {
  searchParams?: {
    serviceId?: string;
  };
}

interface Service {
  id: number;
  label_en: string;
  label_fil: string;
  icon_src: string;
  bg_color: string;
  description_en: string;
  description_fil: string;
  display_order: number;
}

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const searchParamsObj = await searchParams;
  const serviceIdParam = searchParamsObj?.serviceId ?? "";

  const serviceId = parseInt(serviceIdParam, 10);

  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .single();

  const service: Service = data ?? {
    id: serviceId,
    label_fil: "Service Name",
    icon_src: "/icons/default-service.png",
    bg_color: "#60A5FA",
    description_en: "",
    description_fil: "",
    display_order: 1,
  };

  const description_en = service.description_en;
  const description_fil = service.description_fil;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl shadow-xl overflow-hidden bg-white">
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="rounded-xl bg-blue-200 p-3">
                <Image
                  src={service.icon_src}
                  alt={service.label_en}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>

            <p className="text-center text-lg font-extrabold text-gray-900">
              {service.label_fil}
            </p>

            <p className="mt-4 text-center text-gray-700 leading-relaxed">
              {description_fil}
            </p>

            <p className="mt-6 text-center text-sm text-gray-500">
              {description_en}
            </p>
          </div>

          <div className="w-full">
            <Link
              href={`/kiosk/queue-status?serviceId=${service.id}`}
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-t-lg"
            >
              Continue
            </Link>
            <Link
              href="/kiosk/kiosk-services"
              className="block w-full border-t border-gray-200 text-center py-3 rounded-b-lg bg-white text-gray-800"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
