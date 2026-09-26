import { Service } from "@/types/Services";
import { SMSInstructionTexts } from "@/app/kiosk/pages/sms-input/constants/smsInstructionTexts";
import { SMSInstructionStyle } from "@/app/kiosk/pages/sms-input/constants/smsInstruction";

/** Props for {@link SMSInstruction}. */
interface SMSInstructionProps {
    /** The service record (reserved for service-specific guidance if needed). */
    service: Service;
}

/**
 * Instruction box guiding the patient to enter their mobile number for SMS queue updates.
 *
 * @param props - Component props.
 * @returns Dual-language instructions formatted in a dashed information panel.
 */
export default function SMSInstruction({ service: _service }: SMSInstructionProps) {
    return (
        <div style={SMSInstructionStyle.container}>
            <p style={SMSInstructionStyle.instructionFil}>
                {SMSInstructionTexts.instructionFil}
            </p>
            <div style={SMSInstructionStyle.divider} />
            <p style={SMSInstructionStyle.instructionEn}>
                {SMSInstructionTexts.instructionEn}
            </p>
        </div>
    );
}