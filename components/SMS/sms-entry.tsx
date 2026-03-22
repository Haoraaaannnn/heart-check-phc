"use client";
import { useState } from "react";
import PhoneInput from "./sms-input";
import NumPad from "./sms-numpad";
import ContinueButton from "./sms-buttons";

const MAX = 11;

export default function KioskPhoneEntry() {
  const [phone, setPhone] = useState("");

  const addDigit = (digit: string) => {
    if (phone.length < MAX) setPhone((p) => p + digit);
  };

  const deleteLast = () => setPhone((p) => p.slice(0, -1));

  const handleContinue = () => {
    if (phone.length === MAX) {
      // your logic here
    }
  };

  return (
    <div>
      <PhoneInput phone={phone} onDelete={deleteLast} />
      <NumPad onDigit={addDigit} />
      <ContinueButton disabled={phone.length !== MAX} onClick={handleContinue} />
    </div>
  );
}