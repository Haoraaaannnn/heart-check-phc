"use client";

import { Service } from "@/types/Services";
import { IconBackspace } from "@tabler/icons-react";
import {
    SMS_PHONE_PLACEHOLDER,
    SMSPhoneInputStyle,
    SMSPhoneInputClasses,
} from "@/app/kiosk/pages/sms-input/constants/smsPhoneInput";

/** Props for {@link PhoneInput}. */
interface PhoneInputProps {
    /** The raw phone number string entered so far. */
    phone: string;
    /** Callback to delete the last entered digit. */
    onDelete: () => void;
    /** The service record being booked. */
    service: Service;
}

/**
 * Display bar for the entered phone number with a backspace button.
 *
 * @remarks
 * Automatically formats Philippine mobile numbers into the readable pattern `09XX XXX XXXX`.
 *
 * @param props - Component props.
 * @returns The formatted phone display field with delete button.
 */
export default function PhoneInput({ phone, onDelete, service: _service }: PhoneInputProps) {
    /**
     * Formats numeric digits into spaced groups for mobile readability.
     */
    const formatPhone = (raw: string) => {
        const d = raw.replace(/\D/g, "");
        if (d.length <= 4) return d;
        if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
        return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    };

    return (
        <div style={SMSPhoneInputStyle.container}>
            <div style={SMSPhoneInputStyle.digitsWrapper}>
                {phone.length > 0 ? (
                    formatPhone(phone)
                ) : (
                    <span style={SMSPhoneInputStyle.placeholder}>
                        {SMS_PHONE_PLACEHOLDER}
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={onDelete}
                aria-label="Delete last digit"
                style={SMSPhoneInputStyle.backspaceBtn}
                className={SMSPhoneInputClasses.backspaceBtn}
            >
                <IconBackspace size={28} className={SMSPhoneInputClasses.backspaceIcon} />
            </button>
        </div>
    );
}