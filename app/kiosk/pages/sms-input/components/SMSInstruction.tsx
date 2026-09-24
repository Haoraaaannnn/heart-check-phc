import { Service } from "@/types/Services";
import { smsInputTexts } from "@/app/kiosk/pages/sms-input/constants/smsInputTexts";

import { SMSInstructionStyle } from "@/app/kiosk/pages/sms-input/constants/smsInput";

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
        <div style={SMSInstructionStyle.container} className="border-dashed border-2 border-gray-300 bg-white rounded-2xl shadow-sm">
            <p style={SMSInstructionStyle.instructionFil}>
                {smsInputTexts.instructionFil}
            </p>
            <div className="h-[1px] w-full bg-gray-200 rounded my-2.5 sm:my-3" />
            <p style={SMSInstructionStyle.instructionEn}>
                {smsInputTexts.instructionEn}
            </p>
        </div>
    );
}