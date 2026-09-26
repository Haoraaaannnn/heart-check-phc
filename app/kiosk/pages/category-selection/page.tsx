"use client";

import { useSearchParams } from "next/navigation";
import { IconUser, IconMoodKid, IconArrowNarrowRight } from "@tabler/icons-react";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { CategoryHeaderTexts } from "@/app/kiosk/pages/category-selection/constants/categoryHeaderTexts";
import { CategoryHeaderStyle } from "@/app/kiosk/pages/category-selection/constants/categoryHeader";
import { CategoryCardsTexts } from "@/app/kiosk/pages/category-selection/constants/categoryCardsTexts";
import {
    CategoryCardsStyle,
    CategoryCardsClasses,
    categoryCardsTheme,
} from "@/app/kiosk/pages/category-selection/constants/categoryCards";
import {
    CategoryLayoutStyle,
    CategoryLayoutClasses,
} from "@/app/kiosk/pages/category-selection/constants/categoryLayout";

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
            className={CategoryLayoutClasses.container}
            style={CategoryLayoutStyle.container}
        >
            <div style={CategoryLayoutStyle.contentWrapper}>
                {/* Header Instructions */}
                <div style={CategoryHeaderStyle.header}>
                    <h1 style={CategoryHeaderStyle.title}>
                        {CategoryHeaderTexts.titleFil}
                    </h1>
                    <p style={CategoryHeaderStyle.subtitle}>
                        {CategoryHeaderTexts.titleEn}
                    </p>
                </div>

                {/* Category Options */}
                <div style={CategoryCardsStyle.cardsGrid}>
                    {/* Adult Button */}
                    <button
                        type="button"
                        onClick={() => chooseCategory("Adult")}
                        style={CategoryCardsStyle.card}
                        className={CategoryCardsClasses.adultCard}
                    >
                        <div
                            style={CategoryCardsStyle.adultIconTile}
                            className={CategoryCardsClasses.iconTile}
                        >
                            <IconUser size={64} stroke={1.5} color={categoryCardsTheme.iconFill} />
                        </div>

                        <div>
                            <span style={CategoryCardsStyle.cardTitle}>
                                {CategoryCardsTexts.adultLabelFil}
                            </span>
                            <span style={CategoryCardsStyle.cardSubtitle}>
                                {CategoryCardsTexts.adultLabelEn}
                            </span>
                        </div>

                        <div
                            style={CategoryCardsStyle.ctaAdult}
                            className={CategoryCardsClasses.cta}
                        >
                            <span>{CategoryCardsTexts.cta}</span>
                            <IconArrowNarrowRight size={24} stroke={2} />
                        </div>
                    </button>

                    {/* Pedia Button */}
                    <button
                        type="button"
                        onClick={() => chooseCategory("Pedia")}
                        style={CategoryCardsStyle.card}
                        className={CategoryCardsClasses.pediaCard}
                    >
                        <div
                            style={CategoryCardsStyle.pediaIconTile}
                            className={CategoryCardsClasses.iconTile}
                        >
                            <IconMoodKid size={64} stroke={1.5} color={categoryCardsTheme.iconFill} />
                        </div>

                        <div>
                            <span style={CategoryCardsStyle.cardTitle}>
                                {CategoryCardsTexts.pediaLabelFil}
                            </span>
                            <span style={CategoryCardsStyle.cardSubtitle}>
                                {CategoryCardsTexts.pediaLabelEn}
                            </span>
                        </div>

                        <div
                            style={CategoryCardsStyle.ctaPedia}
                            className={CategoryCardsClasses.cta}
                        >
                            <span>{CategoryCardsTexts.cta}</span>
                            <IconArrowNarrowRight size={24} stroke={2} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
