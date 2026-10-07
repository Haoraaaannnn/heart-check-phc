"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { CategoryHeaderTexts } from "@/app/kiosk/pages/category-selection/constants/categoryHeaderTexts";
import { CategoryHeaderStyle } from "@/app/kiosk/pages/category-selection/constants/categoryHeader";
import { CategoryCardsTexts } from "@/app/kiosk/pages/category-selection/constants/categoryCardsTexts";
import {
    CategoryCardsStyle,
    CategoryCardsClasses,
    CategoryCardsIcons,
    categoryCardsTheme,
} from "@/app/kiosk/pages/category-selection/constants/categoryCards";
import {
    CategoryLayoutStyle,
    CategoryLayoutClasses,
} from "@/app/kiosk/pages/category-selection/constants/categoryLayout";

/**
 * Inner component reading search parameters.
 */
function CategorySelectionContent() {
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
        if (serviceLabel) params.set("serviceLabel", serviceLabel);
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
            <div
                className={CategoryLayoutClasses.contentWrapper}
                style={CategoryLayoutStyle.contentWrapper}
            >
                {/* Header Instructions: sticky greetings & prompt on top */}
                <header
                    className={CategoryLayoutClasses.headerWrapper}
                    style={CategoryLayoutStyle.headerWrapper}
                >
                    <div style={CategoryHeaderStyle.header}>
                        <h1 style={CategoryHeaderStyle.title}>
                            {CategoryHeaderTexts.titleFil}
                        </h1>
                        <p style={CategoryHeaderStyle.subtitle}>
                            {CategoryHeaderTexts.titleEn}
                        </p>
                    </div>
                </header>

                {/* Age category cards scroll area */}
                <div
                    className={CategoryLayoutClasses.cardsScrollArea}
                    style={CategoryLayoutStyle.cardsScrollArea}
                >
                    <div
                        style={CategoryCardsStyle.cardsGrid}
                        className={CategoryCardsClasses.grid}
                    >
                        {/* Adult Button */}
                        <button
                            type="button"
                            onClick={() => chooseCategory("Adult")}
                            style={CategoryCardsStyle.card}
                            className={CategoryCardsClasses.adultCard}
                        >
                            {/* Brand-colored icon container */}
                            <div
                                style={CategoryCardsStyle.iconWrapper}
                                className={CategoryCardsClasses.cardIconWrapper}
                            >
                                <i
                                    className={`bx ${CategoryCardsIcons.adult}`}
                                    style={CategoryCardsStyle.adultIcon}
                                    aria-hidden="true"
                                />
                            </div>

                            {/* Category Labels */}
                            <div style={CategoryCardsStyle.labelsWrapper}>
                                <span style={CategoryCardsStyle.cardTitle}>
                                    {CategoryCardsTexts.adultLabelFil}
                                </span>
                                <div style={CategoryCardsStyle.divider} />
                                <span style={CategoryCardsStyle.cardSubtitle}>
                                    {CategoryCardsTexts.adultLabelEn}
                                </span>
                            </div>

                            {/* Directional navigation indicator */}
                            <i
                                className={`bx ${CategoryCardsIcons.arrow} ${CategoryCardsClasses.cardArrow}`}
                                style={CategoryCardsStyle.arrowIcon}
                                aria-hidden="true"
                            />
                        </button>

                        {/* Pedia Button */}
                        <button
                            type="button"
                            onClick={() => chooseCategory("Pedia")}
                            style={CategoryCardsStyle.card}
                            className={CategoryCardsClasses.pediaCard}
                        >
                            {/* Brand-colored icon container */}
                            <div
                                style={CategoryCardsStyle.iconWrapper}
                                className={CategoryCardsClasses.cardIconWrapper}
                            >
                                <i
                                    className={`bx ${CategoryCardsIcons.pedia}`}
                                    style={CategoryCardsStyle.pediaIcon}
                                    aria-hidden="true"
                                />
                            </div>

                            {/* Category Labels */}
                            <div style={CategoryCardsStyle.labelsWrapper}>
                                <span style={CategoryCardsStyle.cardTitle}>
                                    {CategoryCardsTexts.pediaLabelFil}
                                </span>
                                <div style={CategoryCardsStyle.divider} />
                                <span style={CategoryCardsStyle.cardSubtitle}>
                                    {CategoryCardsTexts.pediaLabelEn}
                                </span>
                            </div>

                            {/* Directional navigation indicator */}
                            <i
                                className={`bx ${CategoryCardsIcons.arrow} ${CategoryCardsClasses.cardArrow}`}
                                style={CategoryCardsStyle.arrowIcon}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Unified kiosk step where the patient selects their age category (Adult or Pedia).
 * Wrapped in Suspense boundary to support Next.js static prerendering with useSearchParams.
 *
 * @returns The age category selection screen.
 */
export default function CategorySelectionPage() {
    return (
        <Suspense fallback={null}>
            <CategorySelectionContent />
        </Suspense>
    );
}

