'use client';

import { Patient } from '@/types/Types';
import { fetchActiveCounters } from '@/lib/counters';
import { DEFAULT_COUNTERS } from '@/lib/facilities';
import { useEffect, useRef, useState } from 'react';

type RegistrationLayoutProps = {
  patients: Patient[];
};

export function RegistrationLayout({ patients }: RegistrationLayoutProps) {
  const [counters, setCounters] = useState<number[]>(DEFAULT_COUNTERS);
  const announcedPatientsRef = useRef<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingAnnouncements = useRef<{ patient: Patient; counterNum: number }[]>([]);

  useEffect(() => {
    const load = () => fetchActiveCounters().then(setCounters);
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const speak = async (text: string, times: number = 2) => {
    return new Promise<void>((resolve) => {
      let count = 0;
      const audio = new Audio();

      const playNext = async () => {
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          });
          if (!response.ok) { resolve(); return; }
          const arrayBuffer = await response.arrayBuffer();
          const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          audio.src = audioUrl;
          audio.play();
          audio.onended = () => {
            count++;
            if (count < times) {
              setTimeout(playNext, 400);
            } else {
              URL.revokeObjectURL(audioUrl);
              resolve();
            }
          };
        } catch {
          resolve();
        }
      };

      playNext();
    });
  };

  const processAnnouncements = async () => {
    if (isProcessing) return;
    if (pendingAnnouncements.current.length === 0) return;

    setIsProcessing(true);

    while (pendingAnnouncements.current.length > 0) {
      const item = pendingAnnouncements.current.shift();
      if (item) {
        const num = item.patient.patientNum;
        const letter = num.charAt(0);
        const digits = parseInt(num.slice(1), 10).toString();
        const message = `Number ${letter} ${digits}, Number ${letter} ${digits}, please proceed to Counter ${item.counterNum}`;
        await speak(message, 2);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsProcessing(false);
  };

  useEffect(() => {
    const newAnnouncements: { patient: Patient; counterNum: number }[] = [];

    for (const counterNum of counters) {
      const counterPatients = patients.filter(p => p.counter === counterNum);

      if (counterPatients.length > 0) {
        const topPatient = counterPatients[0];

        if (!announcedPatientsRef.current.has(topPatient.id)) {
          announcedPatientsRef.current.add(topPatient.id);
          newAnnouncements.push({ patient: topPatient, counterNum });
        }
      }
    }

    if (newAnnouncements.length > 0) {
      pendingAnnouncements.current.push(...newAnnouncements);
      processAnnouncements();
    }
  }, [patients, counters]);

const colCount = Math.max(counters.length, 1);
const numFont = `min(${Math.max(2.2, 20 / (colCount + 1))}vw, 12vh)`;
const smallFont = `min(${Math.max(1.2, 8 / (colCount + 1))}vw, 2.6vh)`;

return (
  <div className="h-full p-[clamp(10px,2vh,36px)]">
    <table className="w-full h-full table-fixed border-collapse">
      <thead>
        <tr className="bg-gray-100 dark:bg-[#1f1f1f] border-b-2 border-gray-200 dark:border-[#2e2e2e]">
          <th className="w-[14%] px-2 py-[1.2vh] text-left text-gray-600 dark:text-[#d4d4d4] text-[clamp(10px,2vh,22px)] font-semibold uppercase tracking-wider">
            Registration Counters
          </th>
          {counters.map(n => (
            <th key={n} className="px-2 py-[1.2vh] text-center border-l border-gray-200 dark:border-[#2e2e2e] text-gray-600 dark:text-[#d4d4d4] text-[clamp(10px,2vh,22px)] font-semibold uppercase tracking-wider">
              Counter {n}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-2 font-bold text-gray-700 dark:text-[#f5f5f5] text-[clamp(14px,3vh,30px)] bg-gray-50 dark:bg-[#1a1a1a] align-middle">
            Queue Numbers
          </td>
          {counters.map(n => {
            const list = patients.filter(p => p.counter === n);
            const [top, ...rest] = list;
            return (
              <td key={n} className="border-l border-gray-100 dark:border-[#2e2e2e] align-middle text-center overflow-hidden p-[0.8vh]">
                {!top ? (
                  <span className="text-gray-300" style={{ fontSize: smallFont }}>—</span>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-[0.8vh] overflow-hidden">
                    <div className="relative w-full bg-[#cc3535] rounded-3xl ring-4 ring-red-100 shadow-lg py-[1.5vh] flex flex-col items-center">
                      <span className="text-white/80 font-black uppercase tracking-widest" style={{ fontSize: smallFont }}>Now Serving</span>
                      <span className="text-white font-black tabular-nums leading-none" style={{ fontSize: numFont }}>{top.patientNum}</span>
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-300 ring-2 ring-white animate-pulse" />
                    </div>
                    {rest.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-x-2 text-gray-400 font-black tabular-nums" style={{ fontSize: smallFont }}>
                        {rest.slice(0, 3).map(p => <span key={p.id}>{p.patientNum}</span>)}
                        {rest.length > 3 && <span>+{rest.length - 3}</span>}
                      </div>
                    )}
                  </div>
                )}
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  </div>
);
}