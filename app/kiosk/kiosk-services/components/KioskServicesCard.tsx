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
            className="relative flex items-center h-41 gap-4 px-6 py-4 rounded-2xl transition-all active:scale-95 overflow-hidden bg-white border-2 border-gray-300 text-left"
        >
            {/* Brand-colored icon tile */}
            <div className="size-22 shrink-0 bg-brand p-4 rounded-2xl flex items-center justify-center">
                <Icon size={76} stroke={1.5} color="#ffffff" />
            </div>

            {/* Labels. min-w-0 lets the text wrap instead of pushing the arrow out. */}
            <div className="relative z-10 flex flex-col flex-1 min-w-0 pl-2 text-black">
                <span className="font-black text-[30px] landscape:text-[clamp(22px,1.6vw,30px)]">
                    {service.label_fil}
                </span>
                <span className="w-fit inline-block bg-red-300/20 border border-red-500/35 text-black text-[20px] landscape:text-[clamp(16px,1.1vw,20px)] px-4 py-1 rounded-full">
                    {service.label_en}
                </span>
            </div>

            <TablerIcons.IconArrowNarrowRight
                size={36}
                stroke={2}
                color="#D7D6D6"
                className="shrink-0"
            />
        </button>
    );
}