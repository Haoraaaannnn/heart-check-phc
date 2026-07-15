"use client";

import { useRouter } from "next/navigation";
import { PatientCategory } from "@/app/kiosk/kiosk-new-old-selection/Types/PatientType";
import * as TablerIcons from "@tabler/icons-react";

export default function KioskNewOldSelectionPage({patientCategory}: {patientCategory: PatientCategory}) {

    const router = useRouter();
    const pc = patientCategory;
    const Icon = (TablerIcons as Record<string, any>)[pc.icon_src] ?? TablerIcons.IconCircleDashed;

    return (
        <button
        onClick={() => router.push(`/kiosk/kiosk-services?type=${pc.type}`)}
        className="relative flex items-center h-[200px] gap-2 pl-8 pr-12 py-6 rounded-[16px] transition-all active:scale-95 overflow-hidden bg-white border-2 border-gray-300"
        >
            <div className="w-22 h-22 bg-[#7f0407] py-4 px-4 rounded-[16px] flex items-center justify-center">
                <Icon size={76} stroke={1.5} color="#ffffff" />
            </div>
            <div className="relative z-10 flex flex-col flex-1 min-w-0 pl-2 text-black text-left">
                <span className="font-black text-[30px]">{pc.label_fil}</span>
                <span className="w-fit inline-block bg-red-300/20 border border-red-500/35 text-black text-[20px]  px-4 py-1 rounded-full">{pc.label_en}</span>
            </div>
            <TablerIcons.IconArrowNarrowRight size={36} stroke={2} color="#D7D6D6" />
        </button>
    );
}