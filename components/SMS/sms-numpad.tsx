"use client";

interface Props { onDigit: (digit: string) => void; }

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

export default function NumPad({ onDigit }: Props) {
  return (
    <div className="grid grid-cols-3 grid-rows-4 gap-[min(2vw,2vh,24px)] w-full h-full max-w-[min(90vw,800px)] max-h-[min(90vh,700px)] mx-auto">
      {BUTTONS.map((btn, i) =>
        btn === "" ? <div key={i} /> : (
          <button
            key={i} onClick={() => onDigit(btn)}
            className="w-full h-full bg-gray-100 rounded-[min(2vw,2vh,20px)] text-[min(8vw,8vh,72px)] font-bold text-black shadow-[0_min(1vw,1vh,8px)_0_#b8b8b8] flex items-center justify-center transition-all active:translate-y-[min(0.5vw,0.5vh,4px)] active:shadow-none hover:bg-gray-200"
          >
            {btn}
          </button>
        )
      )}
    </div>
  );
}