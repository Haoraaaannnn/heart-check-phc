import Link from "next/link";
import * as TablerIcons from "@tabler/icons-react";
import { Service } from "@/types/Services";

export default function ServiceCard({service, patientType,}: {service: Service; patientType?: string;}) {
    const Icon = (TablerIcons as Record<string, any>)[service.icon_src] ?? TablerIcons.IconCircleDashed;

    const href = patientType
        ? `/kiosk/confirmation?serviceId=${service.id}&type=${patientType}`
        : `/kiosk/confirmation?serviceId=${service.id}`;

    return (
        <Link
        href={href}
        className="relative flex items-center h-[164px] gap-2 pl-8 pr-12 py-6 rounded-[16px] transition-all active:scale-95 overflow-hidden bg-white border-2 border-gray-300"
        >
        <div className="w-22 h-22 bg-brand py-4 px-4 rounded-[16px] flex items-center justify-center">
            <Icon size={76} stroke={1.5} color="#ffffff" />
        </div>
        <div className="relative z-10 flex flex-col flex-1 min-w-0 pl-6 text-black">
            <span className="font-black text-[30px]">{service.label_fil}</span>
            <span className="w-fit inline-block bg-red-300/20 border border-red-500/35 text-black text-[20px] px-4 py-1 rounded-full">
            {service.label_en}
            </span>
        </div>
        <TablerIcons.IconArrowNarrowRight size={36} stroke={2} color="#D7D6D6" />
        </Link>
    );
}