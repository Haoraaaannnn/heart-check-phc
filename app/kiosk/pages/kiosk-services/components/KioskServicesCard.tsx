import { Service } from "@/types/Services";
import {
    KioskServicesCardStyle,
    KioskServicesClasses,
    KioskServicesIcons,
} from "@/app/kiosk/pages/kiosk-services/constants/kioskServices";
import { resolveServiceIcon } from "@/constants/icons";

/** Props for {@link ServiceCard}. */
interface Props {
    /** A row from the `services` table. */
    service: Service;

    /** Called with `service` when the card is tapped. */
    onSelect: (service: Service) => void;
}

/**
 * One tappable service button on the kiosk.
 *
 * @remarks
 * - Icon: Resolved dynamically via {@link resolveServiceIcon} using Boxicons.
 * - Title: `label_fil` (Filipino, large). Pill: `label_en` (English, smaller).
 * - Responsive fluid minHeight and word wrapping so text never clips or hides on smaller screens.
 * - Icon and arrow use fluid clamp scaling and `shrink-0` to protect text area.
 *
 * @param props - Component props.
 * @returns A button showing the service icon, both labels, and an arrow.
 */
export default function ServiceCard({ service, onSelect }: Props) {
    const iconClass = resolveServiceIcon(service);

    return (
        <button
            type="button"
            onClick={() => onSelect(service)}
            style={KioskServicesCardStyle.card}
            className={KioskServicesClasses.card}
        >
            {/* Brand-colored icon container */}
            <div
                style={KioskServicesCardStyle.iconWrapper}
                className={KioskServicesClasses.cardIconWrapper}
            >
                <i
                    className={`bx ${iconClass}`}
                    style={KioskServicesCardStyle.icon}
                    aria-hidden="true"
                />
            </div>

            {/* Labels. min-w-0 lets the text wrap instead of pushing the arrow out. */}
            <div style={KioskServicesCardStyle.labelWrapper}>
                <span style={KioskServicesCardStyle.title}>
                    {service.label_fil}
                </span>
                <div style={KioskServicesCardStyle.divider} />
                <span style={KioskServicesCardStyle.subtitle}>
                    {service.label_en}
                </span>
            </div>

            <i
                className={`bx ${KioskServicesIcons.arrow} ${KioskServicesClasses.cardArrow}`}
                style={KioskServicesCardStyle.arrowIcon}
                aria-hidden="true"
            />
        </button>
    );
}