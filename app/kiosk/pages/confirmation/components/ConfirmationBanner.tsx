import type { Service } from "@/types/Services";
import {
    ConfirmationBannerStyle,
    ConfirmationBannerClasses,
} from "@/app/kiosk/pages/confirmation/constants/confirmationBanner";
import { resolveServiceIcon } from "@/constants/icons";

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
    const iconClass = resolveServiceIcon(service);

    return (
        <div style={ConfirmationBannerStyle.banner}>
            <i
                className={`bx ${iconClass} ${ConfirmationBannerClasses.icon}`}
                style={ConfirmationBannerStyle.icon}
                aria-hidden="true"
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