import { Service } from "@/types/Services";
import { confirmationTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationTexts";
import { themeColors } from "@/constants/colors";

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
        <div className="flex flex-col items-start w-full p-5 sm:p-6 border-2 border-gray-200 rounded-2xl bg-white shadow-inner">
            <span
                className="inline-block text-white text-lg sm:text-xl font-extrabold px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl mb-3 shadow-sm"
                style={{ backgroundColor: themeColors.brandRed }}
            >
                {confirmationTexts.badgeHeading}
            </span>

            {/* Filipino Description */}
            <p className="mt-1 text-xl sm:text-2xl text-left text-gray-800 leading-snug font-black">
                {service.description_fil}
            </p>

            <div className="h-[2px] w-full bg-gray-200 rounded my-3 sm:my-4" />

            {/* English Description */}
            <p className="text-lg sm:text-xl text-left text-gray-600 leading-snug font-medium">
                {service.description_en}
            </p>
        </div>
    );
}