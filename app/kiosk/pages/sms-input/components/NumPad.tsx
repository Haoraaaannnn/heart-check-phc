import {
    SMSNumPadStyle,
    SMSInputClasses,
} from "@/app/kiosk/pages/sms-input/constants/smsInput";

/** Props for {@link NumPad}. */
interface NumPadProps {
    /** Callback when a digit button (0-9) is tapped. */
    onDigit: (digit: string) => void;
}

/** Layout of keypad buttons (3 columns x 4 rows). */
const KEYPAD_BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

/**
 * On-screen numeric keypad designed for touch kiosks.
 *
 * @param props - Component props.
 * @returns The 3x4 touch-friendly numeric pad.
 */
export default function NumPad({ onDigit }: NumPadProps) {
    return (
        <div style={SMSNumPadStyle.grid}>
            {KEYPAD_BUTTONS.map((btn, index) =>
                btn === "" ? (
                    <div key={index} aria-hidden="true" />
                ) : (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onDigit(btn)}
                        aria-label={`Digit ${btn}`}
                        style={SMSNumPadStyle.keyButton}
                        className={SMSInputClasses.keypadBtn}
                    >
                        {btn}
                    </button>
                )
            )}
        </div>
    );
}