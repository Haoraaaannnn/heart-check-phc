"use client";

interface Props {
  onDigit: (digit: string) => void;
}

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

export default function NumPad({ onDigit }: Props) {
  return (
    <div className="grid grid-cols-3 grid-rows-4 gap-3 md:gap-5 w-full h-full max-w-[800px] max-h-[800px] mx-auto">
      {BUTTONS.map((btn, i) =>
        btn === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => onDigit(btn)}
            className="w-full h-full min-h-[60px] bg-gray-100 rounded-2xl md:rounded-[35px] text-3xl md:text-[50px] font-semibold text-black duration-75 transition-all"
            style={{ boxShadow: "0px 6px 0px #b8b8b8" }}
            onPointerDown={(e) => {
              e.currentTarget.style.boxShadow = "0px 2px 0px #b8b8b8";
              e.currentTarget.style.transform = "translateY(4px)";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.boxShadow = "0px 6px 0px #b8b8b8";
              e.currentTarget.style.transform = "";
            }}
            onPointerCancel={(e) => {
              e.currentTarget.style.boxShadow = "0px 6px 0px #b8b8b8";
              e.currentTarget.style.transform = "";
            }}
          >
            {btn}
          </button>
        )
      )}
    </div>
  );
}