"use client";

import { useState } from "react";
import { Service } from "@/types/Services";
import PhoneInput from "./sms-input";
import NumPad from "./sms-numpad";
import ContinueButton from "./sms-buttons";
import SMSInstruction from "./sms-instruction";

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

  const handleContinue = () => { /* your logic */ };

  return (
    <div className="h-full min-h-0 w-full flex flex-col landscape:grid landscape:grid-cols-2 landscape:grid-rows-[auto_auto_1fr] gap-3 sm:gap-4 md:gap-6 landscape:gap-x-12 landscape:gap-y-6">
        
        <div className="w-full landscape:col-start-1 landscape:row-start-1">
            <SMSInstruction service={service}/>
        </div>
        <div className="w-full landscape:col-start-1 landscape:row-start-2">
            <PhoneInput phone={phone} onDelete={deleteLast} service={service}/>
        </div>
        <div className="flex-1 min-h-0 w-full flex justify-center items-center portrait:max-h-[50vh] landscape:col-start-2 landscape:row-start-1 landscape:row-span-3 landscape:px-4 lg:landscape:px-8">
             <NumPad onDigit={addDigit} />
        </div>
        <div className="flex-none w-full mt-auto landscape:col-start-1 landscape:row-start-3 landscape:self-end">
          <ContinueButton 
            disabled={phone.length !== MAX} 
            onClick={handleContinue} 
            onSkip={handleContinue} 
            service={service}
          />
        </div>
        
    </div>
  );
}