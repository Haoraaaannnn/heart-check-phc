"use client";

import { Service } from "@/types/Services";
import {
    SMS_PHONE_PLACEHOLDER,
    SMS_PHONE_MAX_LENGTH,
    SMSPhoneInputStyle,
    SMSPhoneInputClasses,
    SMSPhoneInputIcons,
} from "@/app/kiosk/pages/sms-input/constants/smsPhoneInput";

/** Props for {@link PhoneInput}. */
interface PhoneInputProps {
    /** The raw phone number string entered so far. */
    phone: string;
    /** Callback to delete the last entered digit. */
    onDelete: () => void;
    /** The service record being booked. */
    service: Service;
    /** Whether the entered phone number is valid when 11 digits are complete. */
    isValid?: boolean;
    /** Optional Filipino error feedback message. */
    errorMessageFil?: string;
    /** Optional English error feedback message. */
    errorMessageEn?: string;
}

/**
 * Display bar for the entered phone number with a backspace button and validation feedback.
 *
 * @remarks
 * Automatically formats Philippine mobile numbers into the readable pattern `09XX XXX XXXX`.
 * Displays inline validation feedback and border state when the number is complete or invalid.
 *
 * @param props - Component props.
 * @returns The formatted phone display field with delete button and feedback.
 */
export default function PhoneInput({
    phone,
    onDelete,
    service: _service,
    isValid,
    errorMessageFil,
    errorMessageEn,
}: PhoneInputProps) {
    /**
     * Formats numeric digits into spaced groups for mobile readability.
     */
    const formatPhone = (raw: string) => {
        const d = raw.replace(/\D/g, "");
        if (d.length <= 4) return d;
        if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
        return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    };

    const isComplete = phone.length === SMS_PHONE_MAX_LENGTH;
    const hasError = Boolean(errorMessageFil);

    // Compute dynamic border/background styling based on validation status
    const containerStyle = {
        ...SMSPhoneInputStyle.container,
        ...(isComplete && isValid ? SMSPhoneInputStyle.containerValid : {}),
        ...(hasError ? SMSPhoneInputStyle.containerError : {}),
    };

    return (
        <div className="w-full flex flex-col">
            <div style={containerStyle}>
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
                    <i
                        className={`bx ${SMSPhoneInputIcons.backspace} ${SMSPhoneInputClasses.backspaceIcon}`}
                        style={SMSPhoneInputStyle.backspaceIcon}
                        aria-hidden="true"
                    />
                </button>
            </div>

            {/* Validation Feedback Message */}
            {hasError && (
                <div style={SMSPhoneInputStyle.feedbackContainer} role="alert">
                    <i
                        className={`bx ${SMSPhoneInputIcons.warning}`}
                        style={SMSPhoneInputStyle.feedbackIcon}
                        aria-hidden="true"
                    />
                    <div style={SMSPhoneInputStyle.feedbackTextWrapper}>
                        {errorMessageFil && (
                            <p style={SMSPhoneInputStyle.feedbackFil}>
                                {errorMessageFil}
                            </p>
                        )}
                        {errorMessageEn && (
                            <p style={SMSPhoneInputStyle.feedbackEn}>
                                {errorMessageEn}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}