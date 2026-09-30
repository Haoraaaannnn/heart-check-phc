'use client';

import { useState } from "react";
import ServiceCard from "@/app/kiosk/pages/kiosk-services/components/KioskServicesCard";
import ConfirmationModal from "@/app/kiosk/pages/confirmation/components/ConfirmationModal";
import KioskBanner from "@/app/kiosk/pages/kiosk-services/components/KioskBanner";
import type { Service } from "@/types/Services";
import {
    KioskServicesLayoutStyle,
    KioskServicesGridStyle,
    KioskServicesClasses,
} from "@/app/kiosk/pages/kiosk-services/constants/kioskServices";

/** Props for {@link KioskServicesGrid}. */
interface Props {
    /** Services already filtered by patient type in `page.tsx`. */
    services: Service[];

    /** Patient type from the `?type=` query param. Undefined if absent or invalid. */
    patientType?: "new" | "old";
}

/**
 * Responsive menu of service cards with integrated greetings banner and confirmation modal.
 *
 * @remarks
 * Follows the single-container layout pattern of `category-selection` (Adult/Pedia):
 * - Outer container centers all content vertically and horizontally within `<main>`.
 * - Inner content wrapper bundles the greetings banner (`KioskBanner`) directly above
 *   the service cards grid with tight spacing as one cohesive unit.
 *
 * @param props - Component props.
 * @returns The unified greetings banner, service cards grid, and confirmation modal.
 */
export default function KioskServicesGrid({ services, patientType }: Props) {
    // The service the patient tapped; passed to the modal for confirmation.
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                {/* Greetings and instruction banner: grouped directly with service buttons */}
                <header
                    className={KioskServicesClasses.headerWrapper}
                    style={KioskServicesLayoutStyle.headerWrapper}
                >
                    <KioskBanner />
                </header>

                {/* Service cards grid */}
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

            <ConfirmationModal
                service={selectedService}
                patientType={patientType}
                isOpen={isModalOpen}
                onClose={handleClose}
            />
        </div>
    );
}