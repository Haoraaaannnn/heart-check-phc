"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useKioskNavigate } from "@/app/kiosk/hooks/useKioskNavigate";
import { createClient } from "@/lib/supabase/client";
import { Service } from "@/types/Services";
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
 * Inner component reading search parameters and rendering category cards.
 */
function CategorySelectionContent() {
    const navigate = useKioskNavigate();
    const searchParams = useSearchParams();

    const serviceId = searchParams.get("serviceId");
    const patientType = searchParams.get("type");
    const serviceLabel = searchParams.get("serviceLabel")?.trim().toLowerCase();

    const [service, setService] = useState<Service | null>(null);

    // Fetch active service record to inspect clinical capabilities checklist
    useEffect(() => {
        if (!serviceId) return;
        const supabase = createClient();
        supabase
            .from("services")
            .select("*")
            .eq("id", parseInt(serviceId, 10))
            .maybeSingle()
            .then(({ data }) => {
                if (data) setService(data as Service);
            });
    }, [serviceId]);

    // Scroll state tracking
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollDown, setCanScrollDown] = useState(false);
    const [canScrollUp, setCanScrollUp] = useState(false);

    /**
     * Inspects the scroll container to verify if overflow exists and whether
     * the patient can scroll downward or upward.
     */
    const updateScrollState = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const hasOverflow = el.scrollHeight > el.clientHeight + 8;
        const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
        const isAtTop = el.scrollTop <= 8;

        setCanScrollDown(hasOverflow && !isAtBottom);
        setCanScrollUp(hasOverflow && !isAtTop);
    }, []);

    // Monitor resize and content mutations to keep scroll indicators accurate
    useEffect(() => {
        updateScrollState();

        const timeout = setTimeout(updateScrollState, 150);
        const el = scrollContainerRef.current;
        if (!el) return () => clearTimeout(timeout);

        const observer = new ResizeObserver(() => {
            updateScrollState();
        });
        observer.observe(el);

        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [updateScrollState]);

    /**
     * Smoothly scrolls the card container downward by one viewport section.
     */
    const handleScrollDown = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        el.scrollBy({
            top: Math.max(el.clientHeight * 0.7, 180),
            behavior: "smooth",
        });
    };

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

        // If service requires cubicle/doctor selection, route to cubicle selection; otherwise to SMS input.
        const nextPath =
            service?.requires_cubicle
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

                {/* Relative wrapper holding scrollable cards and floating scroll indicators */}
                <div
                    className={CategoryLayoutClasses.scrollWrapper}
                    style={CategoryLayoutStyle.scrollWrapper}
                >
                    {/* Top gradient shadow when scrolled */}
                    {canScrollUp && (
                        <div
                            className={CategoryLayoutClasses.scrollTopShadow}
                            style={CategoryLayoutStyle.scrollTopShadow}
                            aria-hidden="true"
                        />
                    )}

                    {/* Age category cards scroll area */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={updateScrollState}
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

                    {/* Bottom gradient shadow when more content exists below */}
                    {canScrollDown && (
                        <div
                            className={CategoryLayoutClasses.scrollBottomShadow}
                            style={CategoryLayoutStyle.scrollBottomShadow}
                            aria-hidden="true"
                        />
                    )}

                    {/* Floating scroll indication badge */}
                    {canScrollDown && (
                        <button
                            type="button"
                            onClick={handleScrollDown}
                            style={CategoryLayoutStyle.scrollIndicator}
                            className={CategoryLayoutClasses.scrollIndicator}
                            aria-label={CategoryCardsTexts.scrollDownAria}
                        >
                            <span style={CategoryLayoutStyle.scrollIndicatorText}>
                                {CategoryCardsTexts.scrollDownBadgeShort}
                            </span>
                            <i
                                className={`bx ${CategoryCardsIcons.chevronDown} ${CategoryLayoutClasses.scrollIndicatorIcon}`}
                                style={CategoryLayoutStyle.scrollIndicatorIcon}
                                aria-hidden="true"
                            />
                        </button>
                    )}
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

