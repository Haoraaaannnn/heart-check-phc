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

  return (
    <div className="p-12 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-200">
            <th className="px-6 py-5 text-left text-gray-600 text-xl font-semibold uppercase tracking-wider sticky left-0 bg-gray-100">
              Registration Counters
            </th>
            {counters.map(n => (
              <th
                key={n}
                className="px-6 py-5 text-center text-gray-600 text-xl font-semibold uppercase tracking-wider border-l border-gray-200"
              >
                Counter {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-6 py-8 font-bold text-gray-700 text-2xl bg-gray-50 sticky left-0 align-top">
              Queue Numbers
            </td>
            {counters.map(n => {
              const list = patients.filter(p => p.counter === n);
              return (
                <td key={n} className="px-6 py-8 text-center border-l border-gray-100 align-top">
                  <div className="space-y-3">
                    {list.map((patient, i) =>
                      i === 0 ? (
                        <div
                          key={patient.id}
                          className="relative bg-[#cc3535] rounded-3xl p-6 shadow-2xl shadow-red-300 ring-[6px] ring-red-100 scale-110 flex flex-col items-center justify-center gap-1 z-10"
                        >
                          <span className="text-white/80 text-sm font-black uppercase tracking-widest">
                            Now Serving
                          </span>
                          <span className="text-white font-black text-7xl tabular-nums leading-none drop-shadow-md">
                            {patient.patientNum}
                          </span>
                          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-green-300 ring-2 ring-white animate-pulse" />
                        </div>
                      ) : (
                        <div
                          key={patient.id}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-center opacity-70"
                        >
                          <span className="text-gray-400 font-black text-2xl tabular-nums">
                            {patient.patientNum}
                          </span>
                        </div>
                      )
                    )}
                    {list.length === 0 && (
                      <div className="text-gray-300 text-xl">—</div>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}