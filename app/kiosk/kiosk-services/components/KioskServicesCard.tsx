import Link from "next/link";
import Image from "next/image";
import { Service } from "@/types/Services";

export default function ServiceCard({service}: {service: Service}){
    return(
        <Link
        href={`/kiosk/confirmation?serviceId=${service.id}`}
        className="relative flex items-center h-[250px] gap-2 pl-8 pr-12 py-6 rounded-[16px] transition-all active:scale-95 overflow-hidden"
        style={{ background: service.bg_color, boxShadow: `0 4px 30px ${service.shadow_color}`}}
        >

            <Image
                src={service.icon_src}
                alt={service.label_en}
                width={120}
                height={120}
                className="w-30 h-30 drop-shadow-md"
            />
            <div className="relative z-10 flex flex-col flex-1 min-w-0   text-white">
                <span className="font-baloo font-black text-[40px]">{service.label_fil}</span>
                <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-[25px] font-bold px-4 py-1 rounded-full">{service.label_en}</span>
            </div>
        </Link>
    );
}