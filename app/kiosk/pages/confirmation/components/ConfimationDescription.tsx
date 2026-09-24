import { Service } from "@/types/Services";
import { confirmationTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationTexts";
import { ConfirmationDescriptionStyle } from "@/app/kiosk/pages/confirmation/constants/confirmation";

/** Props for {@link ConfirmationDescriptions}. */
interface ConfirmationDescriptionsProps {
    /** The service record being confirmed. */
    service: Service;
}

/**
 * Explanatory card displaying both Filipino and English descriptions of a selected service.
 *
 * @param props - Component props.
 * @returns The service description block with dual-language explanations.
 */
export default function ConfirmationDescriptions({ service }: ConfirmationDescriptionsProps) {
    return (
        <div style={ConfirmationDescriptionStyle.container} className="w-full p-5 sm:p-6 border-2 border-gray-200 rounded-2xl bg-white shadow-inner">
            <span style={ConfirmationDescriptionStyle.badge} className="shadow-sm">
                {confirmationTexts.badgeHeading}
            </span>

            {/* Filipino Description */}
            <p style={ConfirmationDescriptionStyle.text} className="mt-1 text-left font-black">
                {service.description_fil}
            </p>

            <div className="h-[2px] w-full bg-gray-200 rounded my-1" />

            {/* English Description */}
            <p style={ConfirmationDescriptionStyle.text} className="text-left font-medium text-gray-600">
                {service.description_en}
            </p>
        </div>
    );
}