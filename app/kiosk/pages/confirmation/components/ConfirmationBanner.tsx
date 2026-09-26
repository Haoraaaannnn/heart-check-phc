import * as TablerIcons from "@tabler/icons-react";
import type { Service } from "@/types/Services";
import {
    ConfirmationBannerStyle,
    ConfirmationBannerClasses,
} from "@/app/kiosk/pages/confirmation/constants/confirmationBanner";

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
        <div style={ConfirmationBannerStyle.banner}>
            <Icon
                className={ConfirmationBannerClasses.icon}
                size={110}
                stroke={1.5}
                color="#ffffff"
            />
            <div style={ConfirmationBannerStyle.textWrapper}>
                <span style={ConfirmationBannerStyle.title}>
                    {service.label_fil}
                </span>
                <span style={ConfirmationBannerStyle.badge}>
                    {service.label_en}
                </span>
            </div>
        </div>
    );
}