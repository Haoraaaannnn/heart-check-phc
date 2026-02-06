// TODO: add the rest of the services

//! This will be temporary until we have setup for database to store the ui in the database 
//! and fetch it in the frontend. For now, we will hardcode the services in the frontend.
'use client';

import { ServiceButton } from "@/components/kiosk/ServiceButton";
import { useLanguage } from "@/app/LanguageContext";

export default function KioskPage() {
    const { t } = useLanguage();
    return (
        <div className="grid grid-cols-3 gap-8 p-10">
            <ServiceButton label={t.services?.consultation || "Konsultasyon"} iconSrc="/icons/consultationIcon.png" bgColor="#7EC8E3" />
            <ServiceButton label={t.services?.opdCard || "OPD Kard"} iconSrc="/icons/opdCardIcon.png" bgColor="#58D2F7" />
            <ServiceButton label={t.services?.prescriptionRefill || "Magparefill ng gamot"} iconSrc="/icons/refillPrescriptionIcon.png" bgColor="#58D2F7" />
            <ServiceButton label={t.services?.ecg || "ECG"} iconSrc="/icons/ecgIcon.png" bgColor="#7EC8E3" />
        </div>
    )
}