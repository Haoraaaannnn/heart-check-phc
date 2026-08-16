'use client';

import { useState } from "react";
import ServiceCard from "@/app/kiosk/kiosk-services/components/KioskServicesCard";
import ConfirmationModal from "@/app/kiosk/confirmation/components/ConfirmationModal";
import type { Service } from "@/types/Services";

interface Props {
    services: Service[];
    patientType?: "new" | "old";
}

export default function KioskServicesGrid({ services, patientType }: Props) {
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSelect = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex-1 flex flex-col justify-center min-h-0 w-full">
                <div className="grid grid-cols-2 w-full max-w-full landscape:grid-cols-2 content-evenly gap-x-8 gap-y-8 px-8 py-8">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            patientType={patientType}
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