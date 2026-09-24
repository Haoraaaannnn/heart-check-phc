import { Service } from "@/types/Services";
import { smsInputTexts } from "@/app/kiosk/pages/sms-input/constants/smsInputTexts";

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
        <div className="w-full border-dashed border-2 border-gray-300 p-4 sm:p-5 bg-white text-center rounded-2xl shadow-sm">
            <p className="font-black text-gray-900 leading-tight text-lg sm:text-xl">
                {smsInputTexts.instructionFil}
            </p>
            <div className="h-[1px] w-full bg-gray-200 rounded my-2.5 sm:my-3" />
            <p className="font-semibold text-gray-500 leading-tight text-sm sm:text-base">
                {smsInputTexts.instructionEn}
            </p>
        </div>
    );
}