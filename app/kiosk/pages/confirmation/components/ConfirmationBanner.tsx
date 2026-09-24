import * as TablerIcons from "@tabler/icons-react";
import type { Service } from "@/types/Services";
import { themeColors } from "@/constants/colors";

/** Tabler icons mapping for runtime resolution. */
const ICONS = TablerIcons as unknown as Record<string, TablerIcons.Icon | undefined>;

/** Props for {@link ServiceBanner}. */
interface ServiceBannerProps {
    /** The service record to display. */
    service: Service;
}

/**
 * Top banner header displaying service icons and labels for full-page confirmation.
 *
 * @param props - Component props.
 * @returns The service banner with brand background.
 */
export default function ServiceBanner({ service }: ServiceBannerProps) {
    const Icon = ICONS[service.icon_src] ?? TablerIcons.IconCircleDashed;

    return (
        <div
            className="relative flex justify-center items-center px-4 sm:px-6 py-6 md:py-8 overflow-hidden text-white"
            style={{ backgroundColor: themeColors.brandRed }}
        >
            <Icon
                className="w-16 sm:w-24 md:w-28 h-16 sm:h-24 md:h-28 drop-shadow-md shrink-0"
                size={110}
                stroke={1.5}
                color="#ffffff"
            />
            <div className="relative z-10 flex flex-col p-4 md:p-6 min-w-0">
                <span className="font-black text-2xl sm:text-4xl lg:text-[42px] leading-tight truncate">
                    {service.label_fil}
                </span>
                <span className="mt-2 w-fit inline-block bg-white/20 border border-white/35 text-white text-base sm:text-xl lg:text-2xl font-bold px-4 py-1 rounded-full leading-none">
                    {service.label_en}
                </span>
            </div>
        </div>
    );
}