'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import ServiceCard from "@/app/kiosk/pages/kiosk-services/components/KioskServicesCard";
import ConfirmationModal from "@/app/kiosk/pages/confirmation/components/ConfirmationModal";
import KioskBanner from "@/app/kiosk/pages/kiosk-services/components/KioskBanner";
import type { Service } from "@/types/Services";
import {
    KioskServicesLayoutStyle,
    KioskServicesGridStyle,
    KioskServicesClasses,
    KioskServicesIcons,
} from "@/app/kiosk/pages/kiosk-services/constants/kioskServices";
import { KioskServicesTexts } from "@/app/kiosk/pages/kiosk-services/constants/kioskServicesTexts";

/** Props for {@link KioskServicesGrid}. */
interface Props {
    /** Services already filtered by patient type in `page.tsx`. */
    services: Service[];

    /** Patient type from the `?type=` query param. Undefined if absent or invalid. */
    patientType?: "new" | "old";
}

/**
 * Responsive menu of widened service cards with sticky greetings banner, scroll indicator, and confirmation modal.
 *
 * @remarks
 * Architecture:
 * - Greetings banner (`KioskBanner`) is sticky on top so instructions are never hidden.
 * - Service buttons are widened across an expansive container (`max-w-[1650px]`) with responsive 2-column or 3-column distribution.
 * - Dynamic scroll indicator pill and subtle scroll shadows indicate when additional services are available below the fold.
 * - Tapping the floating scroll indicator automatically smooth-scrolls down.
 * - Reaching the end of the list automatically hides the indicator, keeping all cards fully unobstructed.
 *
 * @param props - Component props.
 * @returns The unified greetings banner, scrollable service cards grid, and confirmation modal.
 */
export default function KioskServicesGrid({ services, patientType }: Props) {
    // The service the patient tapped; passed to the modal for confirmation.
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
    }, [services, updateScrollState]);

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
     * Remembers which service was tapped and opens the confirmation modal.
     *
     * @param service - The service card the patient tapped.
     */
    const handleSelect = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    /**
     * Closes the modal.
     */
    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <div
            className={KioskServicesClasses.container}
            style={KioskServicesLayoutStyle.container}
        >
            <div
                className={KioskServicesClasses.contentWrapper}
                style={KioskServicesLayoutStyle.contentWrapper}
            >
                {/* Greetings and instruction banner: sticky at top */}
                <header
                    className={KioskServicesClasses.headerWrapper}
                    style={KioskServicesLayoutStyle.headerWrapper}
                >
                    <KioskBanner />
                </header>

                {/* Relative wrapper holding scrollable cards and floating scroll indicators */}
                <div
                    className={KioskServicesClasses.scrollWrapper}
                    style={KioskServicesLayoutStyle.scrollWrapper}
                >
                    {/* Top gradient shadow when scrolled */}
                    {canScrollUp && (
                        <div
                            className={KioskServicesClasses.scrollTopShadow}
                            style={KioskServicesLayoutStyle.scrollTopShadow}
                            aria-hidden="true"
                        />
                    )}

                    {/* Service cards scroll area */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={updateScrollState}
                        className={KioskServicesClasses.cardsScrollArea}
                        style={KioskServicesLayoutStyle.cardsScrollArea}
                    >
                        <div
                            style={KioskServicesGridStyle.grid}
                            className={KioskServicesClasses.grid}
                        >
                            {services.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom gradient shadow when more content exists below */}
                    {canScrollDown && (
                        <div
                            className={KioskServicesClasses.scrollBottomShadow}
                            style={KioskServicesLayoutStyle.scrollBottomShadow}
                            aria-hidden="true"
                        />
                    )}

                    {/* Floating scroll indication badge */}
                    {canScrollDown && (
                        <button
                            type="button"
                            onClick={handleScrollDown}
                            style={KioskServicesLayoutStyle.scrollIndicator}
                            className={KioskServicesClasses.scrollIndicator}
                            aria-label={KioskServicesTexts.scrollDownAria}
                        >
                            <span style={KioskServicesLayoutStyle.scrollIndicatorText}>
                                {KioskServicesTexts.scrollDownBadgeShort}
                            </span>
                            <i
                                className={`bx ${KioskServicesIcons.chevronDown} ${KioskServicesClasses.scrollIndicatorIcon}`}
                                style={KioskServicesLayoutStyle.scrollIndicatorIcon}
                                aria-hidden="true"
                            />
                        </button>
                    )}
                </div>
            </div>

            <ConfirmationModal
                service={selectedService}
                patientType={patientType}
                isOpen={isModalOpen}
                onClose={handleClose}
            />
        </div>
    );
}