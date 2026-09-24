import * as TablerIcons from "@tabler/icons-react";
import { Service } from "@/types/Services";

/**
 * Tabler icons indexed by export name, so `services.icon_src` can pick one
 * at runtime. Values are optional because an unknown name returns undefined.
 */
const ICONS = TablerIcons as unknown as Record<string, TablerIcons.Icon | undefined>;

/** Props for {@link ServiceCard}. */
interface Props {
    /** A row from the `services` table. */
    service: Service;

    /** Called with `service` when the card is tapped. */
    onSelect: (service: Service) => void;
}

import {
    KioskServicesCardStyle,
    kioskServicesColors,
} from "@/app/kiosk/pages/kiosk-services/constants/kioskServices";

/**
 * One tappable service button on the kiosk.
 *
 * @remarks
 * - Icon: `service.icon_src` holds a Tabler icon name (e.g. "IconEcg"),
 *   resolved at render time. An invalid name falls back to `IconCircleDashed`
 *   instead of crashing.
 * - Title: `label_fil` (Filipino, large). Pill: `label_en` (English, smaller).
 * - Fixed height (164px) so all cards line up. Icon and arrow use `shrink-0`
 *   so only the text column shrinks in the narrower 3-column landscape grid.
 * - Landscape text uses `clamp()` to scale down so long labels don't overflow.
 *
 * @param props - Component props.
 * @returns A button showing the service icon, both labels, and an arrow.
 */
export default function ServiceCard({ service, onSelect }: Props) {
    // Look up the icon component by name; fall back if the name is invalid.
    const Icon = ICONS[service.icon_src] ?? TablerIcons.IconCircleDashed;

    return (
        <button
            type="button"
            onClick={() => onSelect(service)}
            style={KioskServicesCardStyle.card}
            className="transition-all active:scale-95 hover:border-red-400 hover:shadow-md"
        >
            {/* Brand-colored icon tile */}
            <div style={KioskServicesCardStyle.iconTile}>
                <Icon size={76} stroke={1.5} color={kioskServicesColors.iconFill} />
            </div>

            {/* Labels. min-w-0 lets the text wrap instead of pushing the arrow out. */}
            <div style={KioskServicesCardStyle.labelWrapper}>
                <span style={KioskServicesCardStyle.title}>
                    {service.label_fil}
                </span>
                <span style={KioskServicesCardStyle.pill}>
                    {service.label_en}
                </span>
            </div>

            <TablerIcons.IconArrowNarrowRight
                size={36}
                stroke={2}
                color={kioskServicesColors.arrowColor}
                className="shrink-0"
            />
        </button>
    );
}