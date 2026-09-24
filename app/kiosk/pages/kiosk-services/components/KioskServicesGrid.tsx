'use client';

import { useState } from "react";
import ServiceCard from "@/app/kiosk/pages/kiosk-services/components/KioskServicesCard";
import ConfirmationModal from "@/app/kiosk/pages/confirmation/components/ConfirmationModal";
import type { Service } from "@/types/Services";

/** Props for {@link KioskServicesGrid}. */
interface Props {
    /** Services already filtered by patient type in `page.tsx`. */
    services: Service[];

    /** Patient type from the `?type=` query param. Undefined if absent or invalid. */
    patientType?: "new" | "old";
}

/**
 * Responsive grid of service cards plus the confirmation modal.
 *
 * @remarks
 * - Portrait: 2 columns (3 would make the cards too narrow).
 * - Landscape: 3 columns, so the usual 7 services fit in 3 rows.
 * - Height and scrolling are NOT handled here. The parent layout
 *   (`kiosk-services/layout.tsx`) owns the scroll area, so extra rows added
 *   to the `services` table scroll instead of being clipped.
 *
 * @param props - Component props.
 * @returns The grid of service cards and the (initially closed) modal.
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
     *
     * Only the open flag is reset. `selectedService` is kept so the modal
     * content doesn't blank out during its closing animation.
     */
    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="w-full">
                <div className="grid w-full grid-cols-2 landscape:grid-cols-3 gap-6 px-8 py-6">
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
        </>
    );
}