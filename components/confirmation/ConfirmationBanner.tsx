import Image from "next/image";
import type { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function ServiceBanner({ service }: Props) {
    return (
        <div className="p-6">
            <div className="relative flex justify-center items-center gap-6 px-8 py-8 rounded-[45px] shadow-xl overflow-hidden"
            style={{background: service.bg_color}}
            >
            <span className="absolute -top-6 -right-6 w-35 h-35 rounded-full opacity-20 bg-white pointer-events-none" />
            <span className="absolute -bottom-6 -left-3 w-50 h-50 rounded-full opacity-20 bg-white pointer-events-none" />
            
            <Image
                src={service.icon_src}
                alt={service.label_en}
                width={120}
                height={120}
                className="w-30 h-30 mb-6 drop-shadow-md"
            />
                <div className="relative z-10 flex flex-col text-white">
                    <span className="font-baloo font-black text-[70px]">{service.label_fil}</span>
                    <span className="font- text-[50px] font-extralight block">{service.label_en}</span>
                </div>
            </div>
        </div>
    );
}