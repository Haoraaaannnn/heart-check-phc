'use client';

import { Patient } from '../types';
import { useEffect, useRef, useState } from 'react';

type RegistrationLayoutProps = {
  patients: Patient[];
};

export function RegistrationLayout({ patients }: RegistrationLayoutProps) {
  const registrationCounters = ['Counter 1', 'Counter 2', 'Counter 3', 'Counter 4', 'Counter 5'];
  const announcedPatientsRef = useRef<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingAnnouncements = useRef<{ patient: Patient; counterNum: number }[]>([]);

  const speak = async (text: string, times: number = 2) => {
    return new Promise<void>((resolve) => {
      let count = 0;
      const audio = new Audio();
      
      const playNext = async () => {
        try {
          const response = await fetch(
            'https://api.deepgram.com/v1/speak?model=aura-2-amalthea-en',
            {
              method: 'POST',
              headers: {
                'Authorization': `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text }),
            }
          );
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
    
    for (let i = 0; i < registrationCounters.length; i++) {
      const counterNum = i + 1;
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
  }, [patients]);

  return (
    <div className="p-12">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-400">
              <th className="px-6 py-5 text-left text-gray-600 text-xl font-semibold uppercase tracking-wider">
                Registration Counters
              </th>
              {registrationCounters.map((counter) => (
                <th key={counter} className="px-6 py-5 text-center text-gray-600 text-xl font-semibold uppercase tracking-wider border-l border-gray-200">
                  {counter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="px-6 py-8 font-bold text-gray-700 text-2xl bg-gray-50">
                Queue Numbers
              </td>
              {registrationCounters.map((counter, index) => {
                const counterNum = index + 1;
                const counterPatients = patients.filter(p => p.counter === counterNum);

                return (
                  <td key={counter} className="px-6 py-8 text-center border-l border-gray-400 align-top">
                    <div className="space-y-3">
                      {counterPatients.length > 0 ? (
                        counterPatients.map((patient, i) => (
                          <div
                            key={patient.id}
                            className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${
                              i === 0 ? 'border-[#cc3535]' : 'border-gray-200'
                            }`}
                          >
                            <span className={`font-black text-5xl tabular-nums block ${
                              i === 0 ? 'text-[#cc3535]' : 'text-gray-400'
                            }`}>
                              {patient.patientNum}
                            </span>
                            <div className={`w-3 h-3 rounded-full mx-auto mt-4 ${
                              i === 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-200'
                            }`} />
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                          <span className="text-gray-300 text-3xl">—</span>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}