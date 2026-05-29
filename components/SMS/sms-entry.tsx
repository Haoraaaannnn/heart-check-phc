"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTimestamp } from "@/lib/logger";
import { Service } from "@/types/Services";
import { sendSMS } from '@/app/actions/sendSMS';
import PhoneInput from "./sms-input";
import NumPad from "./sms-numpad";
import ContinueButton from "./sms-buttons";
import SMSInstruction from "./sms-instruction";

interface Props {
  service: Service;
  patientNum?: string;
}

const MAX = 11;

const SERVICE_PREFIXES: Record<string, string> = {
  'Consultation': 'C', 'OPD Card': 'O', 'Refill Prescription': 'R', 'ECG': 'E',
  'Warfarin': 'W', 'OPD Reschedule': 'S', 'Benzathine': 'B', 'OPD Screening': 'P',
};

const createPatientRecord = async (service: Service) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const serviceName = service.label_en;
    const prefix = SERVICE_PREFIXES[serviceName] ?? 'C';

    const { data: lastPatient } = await supabase.from('patients').select('patientNum')
      .eq('service', serviceName).gte('created_at', startOfDay).lt('created_at', endOfDay)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    let nextNum = 1;
    if (lastPatient?.patientNum) {
      const lastNum = parseInt(lastPatient.patientNum.replace(/\D/g, ''));
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const patientNum = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const { data, error } = await supabase.from('patients').insert({
      patientNum,
      service: serviceName,
      status: 'On Progress', 
      phoneNum: null,
      cubicleNum: null,
    }).select().single();

    if (error) throw error;
    console.log(`${getTimestamp()} ✅ [DB INSERT] New Patient Created with On Progress status:`, { id: data?.id, created_at: data?.created_at, patientNum: data?.patientNum, phoneNum: data?.phoneNum, service: data?.service });
    return patientNum;
  } catch (err) {
    console.error(`${getTimestamp()} ❌ [DB INSERT ERROR] Failed to create patient record for service "${service.label_en}":`, err);
    throw err;
  }
};

export default function KioskPhoneEntry({ service, patientNum: initialPatientNum }: Props) {
  const [phone, setPhone] = useState("");
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [patientNum, setPatientNum] = useState<string | undefined>(initialPatientNum);
  const router = useRouter();

  const addDigit = (digit: string) => { if (phone.length < MAX) setPhone((p) => p + digit); };
  const deleteLast = () => setPhone((p) => p.slice(0, -1));

  const handleContinueConfirm = async () => {
    setShowContinueModal(false);
    try {
      let finalPatientNum = patientNum;
      if (!finalPatientNum) finalPatientNum = await createPatientRecord(service);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const { data, error } = await supabase
        .from('patients')
        .update({ phoneNum: parseInt(phone, 10) })
        .eq('patientNum', finalPatientNum)
        .gte('created_at', startOfDay)
        .select()
        .single();

      if (error) throw error;

      console.log(`${getTimestamp()} ✅ [DB UPDATE] Phone Number Added:`, { id: data?.id, patientNum: data?.patientNum, phoneNum: data?.phoneNum });

      router.push(`/kiosk/queue-print?patientNum=${finalPatientNum}&serviceId=${service.id}`);
    } catch (e) {
      console.error(`${getTimestamp()} ❌ [SMS CONTINUE ERROR]`, e);
    }
  };

  const handleSkipConfirm = async () => {
    setShowSkipModal(false);
    try {
      let finalPatientNum = patientNum;
      if (!finalPatientNum) finalPatientNum = await createPatientRecord(service);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const { data } = await supabase
        .from('patients')
        .select()
        .eq('patientNum', finalPatientNum)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log(`${getTimestamp()} ✅ [SMS SKIP] Phone SMS skipped:`, { id: data?.id, created_at: data?.created_at, patientNum: data?.patientNum, phoneNum: data?.phoneNum, service: data?.service });
      router.push(`/kiosk/queue-print?patientNum=${finalPatientNum}&serviceId=${service.id}`);
    } catch (e) {
      console.error(`${getTimestamp()} ❌ [SMS SKIP ERROR] Failed to skip SMS for service "${service.label_en}":`, e);
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col p-[2vh] pb-[1vh] overflow-hidden bg-white landscape:grid landscape:grid-cols-[1.2fr_1fr] landscape:gap-x-12">

      <div className="flex flex-col gap-[1.5vh] flex-none">
        <SMSInstruction service={service}/>
        <PhoneInput phone={phone} onDelete={deleteLast} service={service}/>
      </div>

      <div className="flex-1 min-h-0 w-full flex items-center justify-center py-[1vh] landscape:row-span-2 landscape:h-full">
        <NumPad onDigit={addDigit} />
      </div>

      <div className="flex-none mt-auto landscape:mt-0 landscape:self-end">
        <ContinueButton 
          disabled={phone.length !== MAX} 
          onContinue={() => setShowContinueModal(true)} 
          onSkip={() => setShowSkipModal(true)} 
          service={service} 
          phone={phone} 
          showContinueModal={showContinueModal} 
          showSkipModal={showSkipModal}
          onContinueConfirm={handleContinueConfirm} 
          onSkipConfirm={handleSkipConfirm}
          onContinueCancel={() => setShowContinueModal(false)} 
          onSkipCancel={() => setShowSkipModal(false)}
        />
      </div>
    </div>
  );
}