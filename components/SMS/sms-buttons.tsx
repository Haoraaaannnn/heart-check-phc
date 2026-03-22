"use client";

interface Props {
  disabled: boolean;
  onClick: () => void;
}

export default function ContinueButton({ disabled, onClick }: Props) {
  return (
    <div>
          <button
      onClick={onClick}
      disabled={disabled}
      className={`mx-8 my-8 w-[calc(100%-4rem)] h-40 py-[18px] bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[50px] font-bold rounded-[45px] tracking-wide transition-all ${!disabled ? "active:scale-95" : ""}`}
    >
      Continue
    </button>
    </div>
  );
}