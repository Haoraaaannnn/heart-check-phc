"use client";

interface Props { onDigit: (digit: string) => void; }

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

export default function NumPad({ onDigit }: Props) {
  return (
    <div className="grid grid-cols-3 grid-rows-4 gap-[min(1.6vw,1.6vh,20px)] w-full h-full max-w-[22rem] mx-auto portrait:max-w-[38rem] 
    landscape:max-w-[38rem] landscape:gap-[min(3.5vw,3.5vh,32px)] landscape:mx-0">
      {BUTTONS.map((btn, i) =>
        btn === "" ? <div key={i} /> : (
          <button
            key={i} onClick={() => onDigit(btn)}
            className="w-full h-full bg-gray-100 rounded-[min(1.6vw,1.6vh,18px)] text-[min(6.5vw,6.5vh,64px)] 
            landscape:min-h-[7.5rem] landscape:text-[min(7.5vw,7.5vh,54px)] landscape:rounded-[min(2.5vw,2.5vh,26px)] 
            font-bold text-black shadow-[0_min(1vw,1vh,8px)_0_#b8b8b8] flex items-center justify-center transition-all 
            active:translate-y-[min(0.5vw,0.5vh,4px)] active:shadow-none hover:bg-gray-200"
          >
            {btn}
          </button>
        )
      )}
    </div>
  );
}