import * as TablerIcons from "@tabler/icons-react";
import type { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function ServiceBanner({ service }: Props) {
    const Icon = (TablerIcons as Record<string, any>)[service.icon_src] ?? TablerIcons.IconCircleDashed;

    return (
        <div>
            <div className="relative flex justify-center items-center px-4 md:px-6 py-4 md:py-6 overflow-hidden bg-[#7f0407]">
            <Icon
                className="w-20 md:w-30 h-20 md:h-30 drop-shadow-md"
                size={120}
                stroke={1.5}
                color="#ffffff"
            />
                <div className="relative z-10 flex flex-col text-white p-4 md:p-8">
                    <span className=" font-black text-3xl md:text-5xl lg:text-[70px]">{service.label_fil}</span>
                    <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-lg md:text-2xl lg:text-[30px] font-bold px-3 md:px-4 py-1 rounded-full">{service.label_en}</span>
                </div>
            </div>
        </div>
    );
}