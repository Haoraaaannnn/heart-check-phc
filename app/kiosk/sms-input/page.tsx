"use client";

import { useState } from "react";

export default function KioskPhoneEntry() {
  const [phone, setPhone] = useState("");
  const MAX = 11;

  const addDigit = (digit: string) => {
    if (phone.length < MAX) setPhone((p) => p + digit);
  };

  const deleteLast = () => setPhone((p) => p.slice(0, -1));

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  };

  const handleContinue = () => {
    if (phone.length === MAX) {
      alert(`Phone submitted: ${formatPhone(phone)}`);
    }
  };

  const buttons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

  return (
    <>
      {/* Decorated text box */}
      <div className="w-full h-18 border-2 border-dashed border-[#aaa] rounded-xl flex items-center justify-center bg-[#e0e0e0]">
        <span className="text-[15px] font-medium text-[#888] tracking-wide">
          Enter your phone number
        </span>
      </div>

      {/* Input row */}
      <div className="flex items-center bg-white rounded-xl px-4 py-3 gap-3">
        <div className="flex-1 text-[22px] font-mono font-semibold tracking-widest text-gray-800 min-h-[32px]">
          {phone.length > 0 ? (
            formatPhone(phone)
          ) : (
            <span className="text-gray-300">0000 000 0000</span>
          )}
        </div>
        <button
          onClick={deleteLast}
          className="text-gray-400 hover:text-gray-700 text-xl px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          ⌫
        </button>
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2.5">
        {buttons.map((btn, i) =>
          btn === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => addDigit(btn)}
              className="h-[72px] bg-[#e5e5e5] active:bg-[#c8c8c8] rounded-xl text-[22px] font-semibold text-gray-700 transition-colors duration-75"
            >
              {btn}
            </button>
          )
        )}
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={phone.length !== MAX}
        className="w-full py-[18px] bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-xl tracking-wide transition-opacity mt-1"
      >
        Continue
      </button>
    </>
  );
}