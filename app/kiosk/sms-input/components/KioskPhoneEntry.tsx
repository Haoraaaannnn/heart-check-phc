// this file is where the data insertion to the database happens

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTimestamp } from "@/lib/logger";
import { Service } from "@/types/Services";
import PhoneInput from "./PhoneInput";
import NumPad from "./NumPad";
import ContinueButton from "./ContinueButton";
import SMSInstruction from "./SMSInstruction";

interface Props {
  service: Service;
  patientNum?: string;
  preferredCubicleNums?: string;
  subcategory?: string;
}

const MAX = 11;

const SERVICE_PREFIXES: Record<string, string> = {
  'OPD Card': 'O', 'Refill Prescription': 'R',
  'Warfarin': 'W', 'OPD Reschedule': 'S', 'Benzathine': 'B',
};

type PrefixRule = {
  match: (serviceName: string, subcategory?: string) => boolean;
  prefix: string;
  groupBySubcategory: boolean;
};

const NUMERIC_PREFIX_RULES: PrefixRule[] = [
  { match: (s) => s === 'OPD Screening', prefix: '1', groupBySubcategory: false },
  { match: (s, sub) => s === 'Consultation' && sub === 'Pedia', prefix: '2', groupBySubcategory: true },
  { match: (s, sub) => s === 'Consultation' && sub === 'Adult', prefix: '4', groupBySubcategory: true },
  { match: (s) => s === 'ECG', prefix: '5', groupBySubcategory: false },
];

function getPrefixInfo(service: Service, subcategory?: string) {
  const name = service.label_en;
  const rule = NUMERIC_PREFIX_RULES.find(r => r.match(name, subcategory));
  if (rule) {
    return { prefix: rule.prefix, groupBySubcategory: rule.groupBySubcategory };
  }
  return { prefix: SERVICE_PREFIXES[name] ?? 'C', groupBySubcategory: false };
}

export default function KioskPhoneEntry({
  service,
  patientNum: initialPatientNum,
  preferredCubicleNums,
  subcategory,
}: Props) {
  const preferredList = preferredCubicleNums ? preferredCubicleNums.split(",") : null;
  const [phone, setPhone] = useState("");
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [patientNum, setPatientNum] = useState<string | undefined>(initialPatientNum);
  const router = useRouter();
  const searchParams = useSearchParams();

  const patientType = searchParams.get("type");
  const cancelHref = patientType
    ? `/kiosk/kiosk-services?type=${encodeURIComponent(patientType)}`
    : "/kiosk/kiosk-services";

  const addDigit = (digit: string) => { if (phone.length < MAX) setPhone((p) => p + digit); };
  const deleteLast = () => setPhone((p) => p.slice(0, -1));

  const createPatient = async (phoneToSave: string | null): Promise<string> => {
    const { prefix, groupBySubcategory } = getPrefixInfo(service, subcategory);

    const t0 = performance.now();
    const { data, error } = await supabase.rpc('create_patient', {
      p_service: service.label_en,
      p_subcategory: subcategory ?? null,
      p_preferred_cubicles: preferredList,
      p_prefix: prefix,
      p_group_by_subcategory: groupBySubcategory,
      p_phone: phoneToSave,
    });
    const elapsed = Math.round(performance.now() - t0);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('RPC returned no row');

    const row = data[0];
    console.log(`${getTimestamp()} [DB INSERT] New Patient Created in ${elapsed}ms:`, {
      id: row.id,
      patientNum: row.patientNum,
      queue_position: row.queue_position,
      service: service.label_en,
    });
    return row.patientNum;
  };

  const handleContinueConfirm = async () => {
    setShowContinueModal(false);
    try {
      const finalPatientNum = patientNum ?? await createPatient(phone);
      setPatientNum(finalPatientNum);
      router.push(`/kiosk/queue-print?patientNum=${finalPatientNum}&serviceId=${service.id}`);
    } catch (e) {
      console.error(`${getTimestamp()} [SMS SKIP ERROR]`, {
        message: e instanceof Error ? e.message : String(e),
        details: e,
        stack: e instanceof Error ? e.stack : undefined,
      });
    }
  };

  const handleSkipConfirm = async () => {
    setShowSkipModal(false);
    try {
      const finalPatientNum = patientNum ?? await createPatient(null);
      setPatientNum(finalPatientNum);
      console.log(`${getTimestamp()} [SMS SKIP] Patient created without phone:`, {
        patientNum: finalPatientNum,
        service: service.label_en,
      });
      router.push(`/kiosk/queue-print?patientNum=${finalPatientNum}&serviceId=${service.id}`);
        } catch (e) {
      console.error(`${getTimestamp()} [SMS SKIP ERROR]`, {
        message: e instanceof Error ? e.message : String(e),
        details: e,
        stack: e instanceof Error ? e.stack : undefined,
      });
    }
  };

  return (
    <div className="h-full min-h-0 w-full grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 md:gap-6 p-[2vh] overflow-hidden bg-white landscape:grid-cols-[1.2fr_1fr] landscape:grid-rows-[auto_minmax(0,1fr)_auto] landscape:gap-x-12 landscape:gap-y-6">

      <div className="flex w-full flex-col gap-[1.5vh] landscape:col-start-1 landscape:row-start-1 landscape:row-span-2 landscape:justify-center landscape:items-start">
        <SMSInstruction service={service} />
        <PhoneInput phone={phone} onDelete={deleteLast} service={service} />
      </div>

      <div className="flex h-full w-full items-center justify-center portrait:pt-[6vh] portrait:pb-[4vh] landscape:items-center landscape:justify-end landscape:pt-[8vh] landscape:pb-[4vh] landscape:col-start-2 landscape:row-start-1 landscape:row-span-2 landscape:px-4 lg:landscape:px-8">
        <NumPad onDigit={addDigit} />
      </div>

      <div className="flex-none w-full landscape:col-start-1 landscape:col-end-3 landscape:row-start-3">
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
          href={cancelHref}
        />
      </div>
    </div>
  );
}