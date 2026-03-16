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
      {/* Input row */}
      <div className="mx-8 my-8 flex items-center bg-gray-400 rounded-[45px] px-4 py-3 gap-3">
        <span className="h-full w-[100px] shrink-0 text-white text-[50px] px-4 py-4 rounded-[45px]">+63</span>
        <div className="flex-1 text-[70px] font-mono font-semibold tracking-widest text-gray-800 flex-item-center">
          
          {phone.length > 0 ? (
            formatPhone(phone)
          ) : (
            <span className="text-gray-300">912 345 6780</span>
          )}
        </div>
        <button
          onClick={deleteLast}
          className="h-full w-[100px] shrink-0 text-gray-400 text-[70px] px-4 py-4 bg-gray-100 active:scale-95 rounded-[45px]"
        >
          ⌫
        </button>
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2.5 mx-8 my-8">
        {buttons.map((btn, i) =>
          btn === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => addDigit(btn)}
              className="h-[150px] bg-[#e5e5e5] active:bg-[#c8c8c8] rounded-[45px] text-[50px] font-semibold text-gray-700 duration-75 transition-all active:scale-95"
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
        className="mx-8 my-8 w-[calc(100%-4rem)] h-40 py-[18px] bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[50px] font-bold rounded-[45] tracking-wide transition-opacity transition-all active:scale-95">
        Continue
      </button>
    </>
  );
}