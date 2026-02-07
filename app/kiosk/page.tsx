// TODO: add link

import { createClient } from "@/lib/supabase/server";

export default async function KioskPage() {
    const supabase = await createClient();

    const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

    return (
    <div className="grid grid-cols-3 gap-8 p-10">
      {services?.map((service) => (
        <button
          key={service.id}
          style={{ backgroundColor: service.bg_color }}
          className="group relative flex flex-col items-center justify-center py-8 max-w-80 rounded-[2rem] shadow-xl hover:scale-105 transition-all active:scale-95 text-white"
        >
          <img 
            src={service.icon_src} 
            alt={service.label_en} 
            className="w-30 h-30 mb-6 drop-shadow-md"
          />
          <span className="text-2xl font-bold block">{service.label_en}</span>
        </button>
      ))}
    </div>
  );
}



// old source code
/*'use client';

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
}*/