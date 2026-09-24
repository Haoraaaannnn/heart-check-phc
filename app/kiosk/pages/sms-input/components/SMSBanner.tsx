"use client";

import { Service } from "@/types/Services";
import { themeColors } from "@/constants/colors";

/** Props for {@link SMSBanner}. */
interface SMSBannerProps {
    /** The service record the patient is checking in for. */
    service: Service;
}

/**
 * Top header banner on the SMS input screen displaying the active service.
 *
 * @param props - Component props.
 * @returns The service banner displaying Filipino and English service names.
 */
export default function SMSBanner({ service }: SMSBannerProps) {
    return (
        <div
            className="relative z-10 w-full px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-white shadow-sm"
            style={{ backgroundColor: themeColors.brandRed }}
        >
            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Main Filipino Label */}
                <span className="font-black text-2xl sm:text-3xl md:text-4xl leading-tight mb-1 text-white">
                    {service.label_fil}
                </span>

                {/* Secondary English Label */}
                <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-xs sm:text-sm md:text-base font-bold px-3 py-0.5 rounded-full">
                    {service.label_en}
                </span>
            </div>
        </div>
    );
}