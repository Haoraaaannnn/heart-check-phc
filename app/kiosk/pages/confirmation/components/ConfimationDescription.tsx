import { Service } from "@/types/Services";
import { ConfirmationDescriptionTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationDescriptionTexts";
import { ConfirmationDescriptionStyle } from "@/app/kiosk/pages/confirmation/constants/confirmationDescription";

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
        <div style={ConfirmationDescriptionStyle.container}>
            <span style={ConfirmationDescriptionStyle.badge}>
                {ConfirmationDescriptionTexts.badgeHeading}
            </span>

            {/* Filipino Description */}
            <p style={ConfirmationDescriptionStyle.textFil}>
                {service.description_fil}
            </p>

            <div style={ConfirmationDescriptionStyle.divider} />

            {/* English Description */}
            <p style={ConfirmationDescriptionStyle.textEn}>
                {service.description_en}
            </p>
        </div>
    );
}