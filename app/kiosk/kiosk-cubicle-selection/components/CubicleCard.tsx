"use client";

import { useRouter } from "next/navigation";
import { CubicleSelectorType } from "@/app/kiosk/kiosk-cubicle-selection/types/CubicleSelectorType";

interface CubicleCardProps {
    cubicle: CubicleSelectorType;
    serviceId?: string;
    serviceColor?: string;
    patientNum?: string;
}

export default function CubicleCard({
    cubicle,
    serviceId,
    serviceColor,
    patientNum,
}: CubicleCardProps) {
    const router = useRouter();
    const cubicleSelector = cubicle;

    const handleClick = () => {
        const params = new URLSearchParams();
        params.set("cubicleNum", cubicleSelector.cubicle_name);
        if (serviceId) params.set("serviceId", serviceId);
        if (patientNum) params.set("patientNum", patientNum);

        router.push(`/kiosk/sms-input?${params.toString()}`);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="relative flex items-center h-[200px] gap-2 pl-8 pr-12 py-6 rounded-[16px] transition-all active:scale-95 overflow-hidden bg-white border-2 border-gray-300"
        >
            <div className="relative z-10 flex flex-col flex-1 min-w-0 pl-6 text-black">
                <span className="font-black text-[30px]">{cubicleSelector.cubicle_name}</span>
            </div>
        </button>
    );
}