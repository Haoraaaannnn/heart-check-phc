import { SMSInstructionTexts } from "@/app/kiosk/pages/sms-input/constants/smsInstructionTexts";
import { SMSInstructionStyle } from "@/app/kiosk/pages/sms-input/constants/smsInstruction";

/** Props for {@link SMSInstruction}. */
interface SMSInstructionProps {
    /** Optional class name for responsive layout adjustments. */
    className?: string;
}

/**
 * Information hint card explaining the benefits of entering a mobile number
 * and clarifying that the step is optional for queue registration.
 *
 * @param props - Component props.
 * @returns The informative hint card with an icon and bilingual explanation.
 */
export default function SMSInstruction({ className }: SMSInstructionProps = {}) {
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