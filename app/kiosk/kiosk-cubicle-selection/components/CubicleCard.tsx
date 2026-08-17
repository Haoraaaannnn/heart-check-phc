"use client";

import { useRouter } from "next/navigation";
import { CubicleSelectorType } from "@/app/kiosk/kiosk-cubicle-selection/types/CubicleSelectorType";

interface CubicleCardProps {
  cubicle: CubicleSelectorType;
  serviceId?: string;
  patientType?: string;
  subcategory?: string;
}

export default function CubicleCard({
  cubicle,
  serviceId,
  patientType,
  subcategory,
}: CubicleCardProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams();

    const cubicleNums = (cubicle.cubicles ?? [])
      .map((link) => link.cubicle)
      .filter(
        (actualCubicle) =>
          actualCubicle &&
          actualCubicle.category === "Consultation" &&
          actualCubicle.subcategory === subcategory
      )
      .map((actualCubicle) => actualCubicle!.cubicleNum);

    if (cubicleNums.length === 0) return;

    if (serviceId) params.set("serviceId", serviceId);
    if (patientType) params.set("type", patientType);
    if (subcategory) params.set("subcategory", subcategory);

    params.set("preferredCubicleNums", cubicleNums.join(","));

    router.push(`/kiosk/sms-input?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex h-[200px] items-center gap-2 overflow-hidden rounded-[16px] border-2 border-gray-300 bg-white py-6 pl-8 pr-12 transition-all active:scale-95"
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col pl-6 text-black">
        <span className="text-[30px] font-black">{cubicle.cubicle_name}</span>
      </div>
    </button>
  );
}