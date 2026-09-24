"use client";

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
        <div className="grid grid-cols-3 grid-rows-4 gap-3 sm:gap-4 md:gap-5 w-full max-w-[24rem] sm:max-w-[28rem] mx-auto">
            {KEYPAD_BUTTONS.map((btn, index) =>
                btn === "" ? (
                    <div key={index} aria-hidden="true" />
                ) : (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onDigit(btn)}
                        aria-label={`Digit ${btn}`}
                        className="w-full h-16 sm:h-20 md:h-22 bg-gray-100 hover:bg-gray-200 rounded-2xl text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 shadow-[0_4px_0_#cbd5e1] flex items-center justify-center transition-all duration-100 active:translate-y-1 active:shadow-none"
                    >
                        {btn}
                    </button>
                )
            )}
        </div>
    );
}