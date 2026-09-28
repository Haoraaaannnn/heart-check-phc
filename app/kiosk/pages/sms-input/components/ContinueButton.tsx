"use client";

import { Service } from "@/types/Services";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { SMSContinueButtonTexts } from "@/app/kiosk/pages/sms-input/constants/smsContinueButtonTexts";
import { SMSModalTexts } from "@/app/kiosk/pages/sms-input/constants/smsModalTexts";
import {
    SMSContinueButtonStyle,
    SMSContinueButtonClasses,
} from "@/app/kiosk/pages/sms-input/constants/smsContinueButton";

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
    /** Optional destination URL for backwards compatibility. */
    href?: string;
    /** Optional custom button label. */
    label?: string;
}

/**
 * Bottom action controls for the SMS input step.
 *
 * @remarks
 * Includes primary Continue button (active when 11 digits are entered)
 * and secondary Skip button with confirmation modals. Universal back navigation
 * is handled by `KioskBackButton` at the top-left of the layout shell.
 *
 * @param props - Component props.
 * @returns The action buttons and associated confirmation modals.
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
    href: _href,
}: ContinueButtonProps) {
    return (
        <div style={SMSContinueButtonStyle.container}>
            {/* Primary Continue Button */}
            <button
                type="button"
                onClick={disabled ? undefined : onContinue}
                disabled={disabled}
                style={SMSContinueButtonStyle.continueBtn}
                className={SMSContinueButtonClasses.continueBtn}
            >
                {SMSContinueButtonTexts.continueBtn}
            </button>

            {/* Secondary Skip Action */}
            <button
                type="button"
                onClick={onSkip}
                style={SMSContinueButtonStyle.skipBtn}
                className={SMSContinueButtonClasses.secondaryBtn}
            >
                {SMSContinueButtonTexts.skipBtn}
            </button>

            {/* Phone Number Verification Modal */}
            <ConfirmationModal
                isOpen={showContinueModal}
                titleFil={SMSModalTexts.continueModalTitleFil}
                titleEng={SMSModalTexts.continueModalTitleEn}
                messageFil={SMSModalTexts.continueModalMsgFil}
                messageEng={SMSModalTexts.continueModalMsgEn}
                confirmText={SMSModalTexts.continueModalConfirm}
                cancelText={SMSModalTexts.continueModalCancel}
                phone={phone}
                onConfirm={onContinueConfirm}
                onCancel={onContinueCancel}
            />

            {/* Skip Warning Modal */}
            <ConfirmationModal
                isOpen={showSkipModal}
                titleFil={SMSModalTexts.skipModalTitleFil}
                titleEng={SMSModalTexts.skipModalTitleEn}
                messageFil={SMSModalTexts.skipModalMsgFil}
                messageEng={SMSModalTexts.skipModalMsgEn}
                phone={phone}
                confirmText={SMSModalTexts.skipModalConfirm}
                cancelText={SMSModalTexts.skipModalCancel}
                onConfirm={onSkipConfirm}
                onCancel={onSkipCancel}
                isDangerous={true}
            />
        </div>
    );
}