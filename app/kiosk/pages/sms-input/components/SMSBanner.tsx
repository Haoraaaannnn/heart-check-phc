"use client";

import { Service } from "@/types/Services";
import { SMSBannerStyle } from "@/app/kiosk/pages/sms-input/constants/smsInput";

/** Props for {@link SMSBanner}. */
interface SMSBannerProps {
    /** The service record the patient is checking in for. */
    service: Service;
}

/**
 * Top header banner on the SMS input screen displaying the active service.
 *
 * @param props - Component props.
 * @returns The service banner displaying Filipino and English service names.
 */
export default function SMSBanner({ service }: SMSBannerProps) {
    return (
        <div style={SMSBannerStyle.banner}>
            <div style={SMSBannerStyle.content}>
                {/* Main Filipino Label */}
                <span style={SMSBannerStyle.labelFil}>
                    {service.label_fil}
                </span>

                {/* Secondary English Label */}
                <span style={SMSBannerStyle.labelEn}>
                    {service.label_en}
                </span>
            </div>
        </div>
    );
}