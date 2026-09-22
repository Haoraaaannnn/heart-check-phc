// app/kiosk/consultation-category/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";

/**
 * Kiosk step where the patient selects their age category
 * (Adult or Pedia) before proceeding to cubicle selection.
 *
 * Reads `serviceId` and `type` (patient type) from the URL query
 * string, appends the chosen `subcategory`, and navigates to
 * `/kiosk/kiosk-cubicle-selection`.
 */
export default function ConsultationCategoryPage() {
  const navigate = useKioskNavigate();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId");
  const patientType = searchParams.get("type");

  /**
   * Builds the next URL's query params (carrying over `serviceId`
   * and `type` if present, adding `subcategory`) and navigates
   * to the cubicle selection step.
   *
   * @param subcategory - The age category the patient selected.
   */
  const chooseCategory = (subcategory: "Adult" | "Pedia") => {
    const params = new URLSearchParams();

    if (serviceId) params.set("serviceId", serviceId);
    if (patientType) params.set("type", patientType);
    params.set("subcategory", subcategory);

    navigate(`/kiosk/kiosk-cubicle-selection?${params.toString()}`);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 px-8">
      <div className="text-center">
        <p className="text-black font-black text-[40px]">
          Piliin ang naaayon sa iyong edad:(notfinaldesign)
        </p>
        <p className="text-gray-600 text-[28px]">
          Select based on your age
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-2 gap-8">
        <button
          type="button"
          onClick={() => chooseCategory("Adult")}
          className="flex flex-row items-center justify-center gap-4 rounded-[16px] border-2 border-gray-300 bg-white px-8 py-16 text-[38px] font-black text-black transition-all active:scale-95"
        >
          <i className="bx bx-male text-red-600 text-[64px]" />
          <span>
            Adult
            <br />
            (19 Pataas)
          </span>
        </button>

        <button
          type="button"
          onClick={() => chooseCategory("Pedia")}
          className="flex flex-row items-center justify-center gap-4 rounded-[16px] border-2 border-gray-300 bg-white px-8 py-16 text-[38px] font-black text-black transition-all active:scale-95"
        >
          <i className="bx bx-child text-blue-600 text-[64px]" />
          <span>
            Pedia
            <br />
            (18 Pababa)
          </span>
        </button>
      </div>
    </div>
  );
}