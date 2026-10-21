import { SMSInstructionTexts } from "@/app/kiosk/pages/sms-input/constants/smsInstructionTexts";
import { SMSInstructionStyle } from "@/app/kiosk/pages/sms-input/constants/smsInstruction";

/** Props for {@link SMSInstruction}. */
interface SMSInstructionProps {
    /** Optional class name for responsive layout adjustments. */
    className?: string;
    /** Whether physical ticket printing is currently unavailable. */
    isFallbackMode?: boolean;
}

/**
 * Information hint card explaining the benefits of entering a mobile number.
 *
 * @remarks
 * In normal mode, displays a notification hint regarding SMS queue updates.
 * In fallback mode (when physical printing is unavailable), renders a unified,
 * high-contrast alert card stating that digital and SMS tickets will be issued.
 *
 * @param props - Component props.
 * @returns The informative hint or fallback notice card.
 */
export default function SMSInstruction({
    className,
    isFallbackMode = false,
}: SMSInstructionProps = {}) {
    if (isFallbackMode) {
        return (
            <div
                style={SMSInstructionStyle.printerNoticeCard}
                className={className}
                role="alert"
                aria-live="polite"
            >
                <i
                    className="bx bx-printer"
                    style={SMSInstructionStyle.printerNoticeIcon}
                    aria-hidden="true"
                />
                <div style={SMSInstructionStyle.printerNoticeContent}>
                    <p style={SMSInstructionStyle.printerNoticeTitle}>
                        {SMSInstructionTexts.printerOfflineTitleFil} / {SMSInstructionTexts.printerOfflineTitleEn}
                    </p>
                    <p style={SMSInstructionStyle.printerNoticeFil}>
                        {SMSInstructionTexts.printerOfflineNoticeFil}
                    </p>
                    <p style={SMSInstructionStyle.printerNoticeEn}>
                        {SMSInstructionTexts.printerOfflineNoticeEn}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={SMSInstructionStyle.hintCard} className={className}>
            <i
                className="bx bx-bell"
                style={SMSInstructionStyle.hintIcon}
                aria-hidden="true"
            />
            <div style={SMSInstructionStyle.hintContent}>
                <p style={SMSInstructionStyle.hintFil}>
                    {SMSInstructionTexts.hintFil}
                </p>
                <p style={SMSInstructionStyle.hintEn}>
                    {SMSInstructionTexts.hintEn}
                </p>
            </div>
        </div>
    );
}