"use client";

interface Props {
  onDigit: (digit: string) => void;
}

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

export default function NumPad({ onDigit }: Props) {
  return (
    <div className="grid grid-cols-3 gap-5 mx-8 my-8">
      {BUTTONS.map((btn, i) =>
        btn === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => onDigit(btn)}
            className="h-[150px] bg-gray-100 rounded-[45px] text-[50px] font-semibold text-black duration-75 transition-all"
            style={{ boxShadow: "0px 8px 0px #b8b8b8" }}
            onPointerDown={(e) => {
              e.currentTarget.style.boxShadow = "0px 2px 0px #b8b8b8";
              e.currentTarget.style.transform = "translateY(6px)";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.boxShadow = "0px 8px 0px #b8b8b8";
              e.currentTarget.style.transform = "";
            }}
            onPointerCancel={(e) => {
              e.currentTarget.style.boxShadow = "0px 8px 0px #b8b8b8";
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