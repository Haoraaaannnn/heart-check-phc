"use client";

import { useSearchParams } from "next/navigation";
import { IconUser, IconMoodKid, IconArrowNarrowRight } from "@tabler/icons-react";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { categorySelectionTexts } from "@/app/kiosk/pages/category-selection/constants/categorySelectionTexts";
import { categorySelectionTheme } from "@/app/kiosk/pages/category-selection/constants/categorySelection";

/**
 * Unified kiosk step where the patient selects their age category
 * (Adult or Pedia) for **any** service that requires it.
 *
 * @remarks
 * The page reads the following URL search parameters:
 * - `serviceId`    – the service record PK, forwarded downstream.
 * - `type`         – patient type (`"new"` / `"old"`), forwarded downstream.
 * - `serviceLabel` – the English service label (e.g. `"Consultation"`,
 *                     `"OPD Screening"`). Determines the *next* route:
 *   - **Consultation** → `/kiosk/pages/kiosk-cubicle-selection`
 *   - **OPD Screening** → `/kiosk/pages/sms-input`
 *
 * By keeping both flows in one page we eliminate the duplicated
 * `consultation-category` and `opd-screening-category` routes.
 *
 * @returns The age category selection screen.
 */
export default function CategorySelectionPage() {
    const navigate = useKioskNavigate();
    const searchParams = useSearchParams();
    const isLandscape = useIsLandscape();

    const serviceId = searchParams.get("serviceId");
    const patientType = searchParams.get("type");
    const serviceLabel = searchParams.get("serviceLabel")?.trim().toLowerCase();

    /**
     * Builds the downstream URL, carrying over existing params and
     * appending the chosen subcategory.
     *
     * @param subcategory - The chosen age category ("Adult" | "Pedia").
     */
    const chooseCategory = (subcategory: "Adult" | "Pedia") => {
        const params = new URLSearchParams();

        if (serviceId) params.set("serviceId", serviceId);
        if (patientType) params.set("type", patientType);
        params.set("subcategory", subcategory);

        // Consultation → cubicle selection, OPD Screening → SMS input.
        const nextPath =
            serviceLabel === "consultation"
                ? "/kiosk/pages/kiosk-cubicle-selection"
                : "/kiosk/pages/sms-input";

        navigate(`${nextPath}?${params.toString()}`);
    };

    return (
        <div
            className={`flex h-full w-full flex-col items-center justify-center px-6 overflow-y-auto ${
                isLandscape ? "pb-[120px]" : "pb-[140px]"
            }`}
        >
            <div className="m-auto flex w-full max-w-4xl flex-col items-center gap-8 md:gap-12">
                {/* Header Instructions */}
                <div className="text-center">
                    <h1 className="text-[32px] sm:text-[40px] font-black text-gray-900 leading-tight">
                        {categorySelectionTexts.titleFil}
                    </h1>
                    <p className="mt-2 text-[20px] sm:text-[26px] font-medium text-gray-600">
                        {categorySelectionTexts.titleEn}
                    </p>
                </div>

                {/* Category Options */}
                <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    {/* Adult Button */}
                    <button
                        type="button"
                        onClick={() => chooseCategory("Adult")}
                        className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-gray-300 bg-white p-8 sm:p-10 transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-lg text-center"
                    >
                        <div
                            className="size-24 rounded-2xl flex items-center justify-center p-4 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: categorySelectionTheme.adultColor }}
                        >
                            <IconUser size={64} stroke={1.5} color={categorySelectionTheme.iconFill} />
                        </div>

                        <div>
                            <span className="block text-[28px] sm:text-[34px] font-black text-gray-900 leading-tight">
                                {categorySelectionTexts.adultLabelFil}
                            </span>
                            <span className="mt-1 block text-[16px] sm:text-[18px] font-bold text-gray-500">
                                {categorySelectionTexts.adultLabelEn}
                            </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-red-700 font-bold text-lg group-hover:translate-x-1 transition-transform">
                            <span>{categorySelectionTexts.cta}</span>
                            <IconArrowNarrowRight size={24} stroke={2} />
                        </div>
                    </button>

                    {/* Pedia Button */}
                    <button
                        type="button"
                        onClick={() => chooseCategory("Pedia")}
                        className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-gray-300 bg-white p-8 sm:p-10 transition-all duration-150 active:scale-95 hover:border-sky-400 hover:shadow-lg text-center"
                    >
                        <div
                            className="size-24 rounded-2xl flex items-center justify-center p-4 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: categorySelectionTheme.pediaColor }}
                        >
                            <IconMoodKid size={64} stroke={1.5} color={categorySelectionTheme.iconFill} />
                        </div>

                        <div>
                            <span className="block text-[28px] sm:text-[34px] font-black text-gray-900 leading-tight">
                                {categorySelectionTexts.pediaLabelFil}
                            </span>
                            <span className="mt-1 block text-[16px] sm:text-[18px] font-bold text-gray-500">
                                {categorySelectionTexts.pediaLabelEn}
                            </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sky-700 font-bold text-lg group-hover:translate-x-1 transition-transform">
                            <span>{categorySelectionTexts.cta}</span>
                            <IconArrowNarrowRight size={24} stroke={2} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
