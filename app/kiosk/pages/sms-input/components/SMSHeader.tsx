"use client";

import { Service } from "@/types/Services";
import { SMSInstructionTexts } from "@/app/kiosk/pages/sms-input/constants/smsInstructionTexts";
import { SMSInstructionStyle } from "@/app/kiosk/pages/sms-input/constants/smsInstruction";

/** Props for {@link SMSHeader}. */
interface SMSHeaderProps {
    /** The active service record for which the ticket is being created. */
    service?: Service;
    /** Subcategory selected (e.g. "Adult" or "Pedia"), if any. */
    subcategory?: string;
}

/**
 * Top title and instruction header for the SMS phone number input screen.
 *
 * @remarks
 * Displays the dual-language page title ("Ilagay ang Mobile Number" / "Enter Mobile Number")
 * and an optional subtle pill badge indicating the active service and category.
 *
 * @param props - Component props.
 * @returns The page instruction header.
 */
export default function SMSHeader({ service, subcategory }: SMSHeaderProps) {
    return (
        <div style={SMSInstructionStyle.header}>
            <h1 style={SMSInstructionStyle.title}>
                {SMSInstructionTexts.titleFil}
            </h1>
            <p style={SMSInstructionStyle.subtitle}>
                {SMSInstructionTexts.titleEn}
            </p>

            {service && (
                <div style={SMSInstructionStyle.serviceBadge}>
                    <span style={SMSInstructionStyle.serviceBadgeText}>
                        {service.label_fil} &bull; {service.label_en}
                        {subcategory ? ` (${subcategory})` : ""}
                    </span>
                </div>
            )}
        </div>
    );
}
