'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import CubicleCard from "@/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCard";
import { CubicleSelectorType } from "@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType";
import {
    CubicleLayoutStyle,
    CubicleLayoutClasses,
} from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout";
import {
    CubicleCardStyle,
    CubicleCardClasses,
    CubicleCardIcons,
} from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard";
import { CubicleCardTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCardTexts";

/** Props for {@link CubicleCardsGrid}. */
interface CubicleCardsGridProps {
    /** Enriched list of cubicle selector records with assigned physician details. */
    cubicles: CubicleSelectorType[];
    /** Current service ID passed down from query parameters. */
    serviceId?: string;
    /** Current patient type ("new" or "old") from query parameters. */
    patientType?: string;
    /** Subcategory ("Adult" or "Pedia") chosen in the category step. */
    subcategory?: string;
}

/**
 * Responsive grid of standardized cubicle cards with smooth scrolling, gradient shadows,
 * and a floating scroll indicator matching the architecture of `KioskServicesGrid`.
 *
 * @remarks
 * Features:
 * - Dynamic scroll indicator pill and subtle scroll shadows indicating when additional cubicles exist below the fold.
 * - Tapping the floating scroll indicator automatically smooth-scrolls downward.
 * - Reaching the end of the scroll container automatically hides the indicator.
 * - ResizeObserver keeps scroll indicators synchronized across viewport orientation changes.
 *
 * @param props - Component props.
 * @returns The scrollable cubicles grid with scroll indicators.
 */
export default function CubicleCardsGrid({
    cubicles,
    serviceId,
    patientType,
    subcategory,
}: CubicleCardsGridProps) {
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
    }, [cubicles, updateScrollState]);

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

    return (
        <div
            className={CubicleLayoutClasses.scrollWrapper}
            style={CubicleLayoutStyle.scrollWrapper}
        >
            {/* Top gradient shadow when scrolled */}
            {canScrollUp && (
                <div
                    className={CubicleLayoutClasses.scrollTopShadow}
                    style={CubicleLayoutStyle.scrollTopShadow}
                    aria-hidden="true"
                />
            )}

            {/* Cubicle cards scroll area */}
            <div
                ref={scrollContainerRef}
                onScroll={updateScrollState}
                className={CubicleLayoutClasses.cardsScrollArea}
                style={CubicleLayoutStyle.cardsScrollArea}
            >
                <div
                    style={CubicleCardStyle.grid}
                    className={CubicleCardClasses.grid}
                >
                    {cubicles.map((cubicle: CubicleSelectorType) => (
                        <CubicleCard
                            key={cubicle.id}
                            cubicle={cubicle}
                            serviceId={serviceId}
                            patientType={patientType}
                            subcategory={subcategory}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom gradient shadow when more content exists below */}
            {canScrollDown && (
                <div
                    className={CubicleLayoutClasses.scrollBottomShadow}
                    style={CubicleLayoutStyle.scrollBottomShadow}
                    aria-hidden="true"
                />
            )}

            {/* Floating scroll indication badge */}
            {canScrollDown && (
                <button
                    type="button"
                    onClick={handleScrollDown}
                    style={CubicleLayoutStyle.scrollIndicator}
                    className={CubicleLayoutClasses.scrollIndicator}
                    aria-label={CubicleCardTexts.scrollDownAria}
                >
                    <span style={CubicleLayoutStyle.scrollIndicatorText}>
                        {CubicleCardTexts.scrollDownBadgeShort}
                    </span>
                    <i
                        className={`bx ${CubicleCardIcons.chevronDown} ${CubicleLayoutClasses.scrollIndicatorIcon}`}
                        style={CubicleLayoutStyle.scrollIndicatorIcon}
                        aria-hidden="true"
                    />
                </button>
            )}
        </div>
    );
}
