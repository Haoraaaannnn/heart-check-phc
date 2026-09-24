"use client";

import { useSearchParams } from "next/navigation";
import { IconUser, IconMoodKid, IconArrowNarrowRight } from "@tabler/icons-react";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { categorySelectionTexts } from "@/app/kiosk/pages/category-selection/constants/categorySelectionTexts";
import {
    categorySelectionTheme,
    CategorySelectionStyle,
} from "@/app/kiosk/pages/category-selection/constants/categorySelection";

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
            style={CategorySelectionStyle.container}
            className={isLandscape ? "pb-[120px]" : "pb-[140px]"}
        >
            <div style={CategorySelectionStyle.contentWrapper}>
                {/* Header Instructions */}
                <div style={CategorySelectionStyle.header}>
                    <h1 style={CategorySelectionStyle.title}>
                        {categorySelectionTexts.titleFil}
                    </h1>
                    <p style={CategorySelectionStyle.subtitle}>
                        {categorySelectionTexts.titleEn}
                    </p>
                </div>

                {/* Category Options */}
                <div style={CategorySelectionStyle.cardsGrid}>
                    {/* Adult Button */}
                    <button
                        type="button"
                        onClick={() => chooseCategory("Adult")}
                        style={CategorySelectionStyle.card}
                        className="group transition-all duration-150 active:scale-95 hover:border-red-400 hover:shadow-lg"
                    >
                        <div
                            style={CategorySelectionStyle.adultIconTile}
                            className="transition-transform group-hover:scale-105"
                        >
                            <IconUser size={64} stroke={1.5} color={categorySelectionTheme.iconFill} />
                        </div>

                        <div>
                            <span style={CategorySelectionStyle.cardTitle}>
                                {categorySelectionTexts.adultLabelFil}
                            </span>
                            <span style={CategorySelectionStyle.cardSubtitle}>
                                {categorySelectionTexts.adultLabelEn}
                            </span>
                        </div>

                        <div
                            style={CategorySelectionStyle.ctaAdult}
                            className="group-hover:translate-x-1 transition-transform"
                        >
                            <span>{categorySelectionTexts.cta}</span>
                            <IconArrowNarrowRight size={24} stroke={2} />
                        </div>
                    </button>

                    {/* Pedia Button */}
                    <button
                        type="button"
                        onClick={() => chooseCategory("Pedia")}
                        style={CategorySelectionStyle.card}
                        className="group transition-all duration-150 active:scale-95 hover:border-sky-400 hover:shadow-lg"
                    >
                        <div
                            style={CategorySelectionStyle.pediaIconTile}
                            className="transition-transform group-hover:scale-105"
                        >
                            <IconMoodKid size={64} stroke={1.5} color={categorySelectionTheme.iconFill} />
                        </div>

                        <div>
                            <span style={CategorySelectionStyle.cardTitle}>
                                {categorySelectionTexts.pediaLabelFil}
                            </span>
                            <span style={CategorySelectionStyle.cardSubtitle}>
                                {categorySelectionTexts.pediaLabelEn}
                            </span>
                        </div>

                        <div
                            style={CategorySelectionStyle.ctaPedia}
                            className="group-hover:translate-x-1 transition-transform"
                        >
                            <span>{categorySelectionTexts.cta}</span>
                            <IconArrowNarrowRight size={24} stroke={2} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
