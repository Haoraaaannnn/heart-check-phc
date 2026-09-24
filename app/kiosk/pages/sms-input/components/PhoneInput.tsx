"use client";

import { Service } from "@/types/Services";
import { IconBackspace } from "@tabler/icons-react";
import { SMS_PHONE_PLACEHOLDER } from "@/app/kiosk/pages/sms-input/constants/smsInput";
import { themeColors } from "@/constants/colors";

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
        <div className="w-full flex items-center bg-white px-4 sm:px-6 border-2 border-gray-200 shadow-inner h-16 sm:h-20 rounded-2xl">
            <div className="flex-1 font-bold tracking-widest text-black text-2xl sm:text-3xl md:text-4xl whitespace-nowrap overflow-hidden">
                {phone.length > 0 ? (
                    formatPhone(phone)
                ) : (
                    <span className="text-gray-300 font-normal">
                        {SMS_PHONE_PLACEHOLDER}
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={onDelete}
                aria-label="Delete last digit"
                className="h-11 sm:h-13 px-4 sm:px-5 flex items-center justify-center text-white active:scale-95 shadow-md rounded-xl transition-all duration-150 hover:brightness-105"
                style={{ backgroundColor: themeColors.brandRed }}
            >
                <IconBackspace size={28} className="sm:size-8" />
            </button>
        </div>
    );
}