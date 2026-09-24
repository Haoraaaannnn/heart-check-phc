"use client";

import Link from "next/link";
import { Service } from "@/types/Services";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { smsInputTexts } from "@/app/kiosk/pages/sms-input/constants/smsInputTexts";
import { SMSContinueButtonStyle } from "@/app/kiosk/pages/sms-input/constants/smsInput";

/** Props for {@link ContinueButton}. */
interface ContinueButtonProps {
    /** The service currently being booked. */
    service: Service;
    /** Whether the primary continue button is disabled (e.g. phone incomplete). */
    disabled: boolean;
    /** Action when Continue is clicked (opens verification modal). */
    onContinue: () => void;
    /** Action when Skip is clicked (opens skip confirmation modal). */
    onSkip: () => void;
    /** Current phone number value for display in the verification modal. */
    phone: string;
    /** Whether the phone verification modal is visible. */
    showContinueModal: boolean;
    /** Whether the skip warning modal is visible. */
    showSkipModal: boolean;
    /** Callback confirming the phone number is correct. */
    onContinueConfirm: () => void;
    /** Callback confirming skipping phone entry. */
    onSkipConfirm: () => void;
    /** Callback dismissing the phone verification modal. */
    onContinueCancel: () => void;
    /** Callback dismissing the skip warning modal. */
    onSkipCancel: () => void;
    /** Destination URL for the cancel button. */
    href: string;
    /** Optional custom button label. */
    label?: string;
}

/**
 * Bottom action controls for the SMS input step.
 *
 * @remarks
 * Includes primary Continue button (validated), Cancel button (navigating back
 * to the correct prior step), and Skip button with a warning that notifications
 * will not be received.
 *
 * @param props - Component props.
 * @returns The bottom action bar and associated confirmation modals.
 */
export default function ContinueButton({
    disabled,
    onContinue,
    onSkip,
    service: _service,
    phone,
    showContinueModal,
    showSkipModal,
    onContinueConfirm,
    onSkipConfirm,
    onContinueCancel,
    onSkipCancel,
    href,
}: ContinueButtonProps) {
    return (
        <div style={SMSContinueButtonStyle.container} className="mt-auto">
            {/* Primary Continue Button */}
            <button
                type="button"
                onClick={disabled ? undefined : onContinue}
                disabled={disabled}
                style={SMSContinueButtonStyle.continueBtn}
                className="disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md hover:brightness-105"
            >
                {smsInputTexts.continueBtn}
            </button>

            {/* Secondary Controls (Cancel and Skip) */}
            <div className="flex gap-3 sm:gap-4 w-full">
                <Link
                    href={href}
                    style={SMSContinueButtonStyle.cancelBtn}
                    className="flex-1 active:scale-95 transition-all hover:bg-gray-50 flex items-center justify-center"
                >
                    {smsInputTexts.cancelBtn}
                </Link>

                <button
                    type="button"
                    onClick={onSkip}
                    style={SMSContinueButtonStyle.cancelBtn}
                    className="flex-1 active:scale-95 transition-all hover:bg-gray-50"
                >
                    {smsInputTexts.skipBtn}
                </button>
            </div>

            {/* Phone Number Verification Modal */}
            <ConfirmationModal
                isOpen={showContinueModal}
                titleFil={smsInputTexts.continueModalTitleFil}
                titleEng={smsInputTexts.continueModalTitleEn}
                messageFil={smsInputTexts.continueModalMsgFil}
                messageEng={smsInputTexts.continueModalMsgEn}
                confirmText={smsInputTexts.continueModalConfirm}
                cancelText={smsInputTexts.continueModalCancel}
                phone={phone}
                onConfirm={onContinueConfirm}
                onCancel={onContinueCancel}
            />

            {/* Skip Warning Modal */}
            <ConfirmationModal
                isOpen={showSkipModal}
                titleFil={smsInputTexts.skipModalTitleFil}
                titleEng={smsInputTexts.skipModalTitleEn}
                messageFil={smsInputTexts.skipModalMsgFil}
                messageEng={smsInputTexts.skipModalMsgEn}
                phone={phone}
                confirmText={smsInputTexts.skipModalConfirm}
                cancelText={smsInputTexts.skipModalCancel}
                onConfirm={onSkipConfirm}
                onCancel={onSkipCancel}
                isDangerous={true}
            />
        </div>
    );
}