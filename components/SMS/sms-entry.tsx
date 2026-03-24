"use client";

import { useState } from "react";
import { Service } from "@/types/Services";
import PhoneInput from "./sms-input";
import NumPad from "./sms-numpad";
import ContinueButton from "./sms-buttons";

interface Props {
  service: Service;
}

const MAX = 11;

export default function KioskPhoneEntry({service}: Props) {
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
    <div className="flex flex-col justify-center">
      <PhoneInput phone={phone} onDelete={deleteLast} service={service}/>
      <NumPad onDigit={addDigit} />
      <ContinueButton disabled={phone.length !== MAX} onClick={handleContinue} />
    </div>
  );
}