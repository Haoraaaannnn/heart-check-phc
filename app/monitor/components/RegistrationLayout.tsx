'use client';

import { Patient } from '@/types/Types';
import { fetchActiveCounters } from '@/lib/counters';
import { DEFAULT_COUNTERS } from '@/lib/facilities';
import { useEffect, useRef, useState } from 'react';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';

import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

/** Props for {@link RegistrationLayout}. */
type RegistrationLayoutProps = {
  /** Patient queue roster for active registration desk intake. */
  patients: Patient[];
};

/**
 * Renders the public queue monitor display for registration intake windows.
 * Dynamically scales across window columns and viewport heights without scrollbars.
 *
 * @param props - Component props containing active patient records.
 * @returns The rendered registration monitor layout element.
 */
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
        const ticket = formatTicketForSpeech(item.patient.patientNum);
        const message = `Number ${ticket}, Number ${ticket}, please proceed to Counter ${item.counterNum}`;
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
    <div className={MONITOR_STYLES.registrationLayout.container}>
      <div className={MONITOR_STYLES.registrationLayout.gridWrapper}>
        <div
          className={MONITOR_STYLES.registrationLayout.columnsContainer}
          style={{ gridTemplateColumns: `repeat(${counters.length}, minmax(0, 1fr))` }}
        >
          {counters.map(counterNum => {
            const counterPatients = patients.filter(p => p.counter === counterNum);
            const activePatient = counterPatients[0];
            const waitingPatients = counterPatients.slice(1);

            return (
              <div key={counterNum} className={MONITOR_STYLES.registrationLayout.counterColumn}>
                <div className={MONITOR_STYLES.registrationLayout.counterHeader}>
                  {MONITOR_TEXTS.registrationLayout.counterLabelPrefix}{counterNum}
                </div>

                <div className={MONITOR_STYLES.registrationLayout.cardBody}>
                  {activePatient ? (
                    <div className={MONITOR_STYLES.registrationLayout.nowServingCard}>
                      <span className={MONITOR_STYLES.registrationLayout.nowServingBadge}>
                        {MONITOR_TEXTS.registrationLayout.nowServingBadge}
                      </span>
                      <span className={MONITOR_STYLES.registrationLayout.nowServingTicket}>
                        {activePatient.patientNum}
                      </span>
                      <div
                        className={MONITOR_STYLES.registrationLayout.activePulseDot}
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <div className={MONITOR_STYLES.registrationLayout.emptyCounterCard}>
                      {MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                    </div>
                  )}

                  {waitingPatients.length > 0 && (
                    <div className={MONITOR_STYLES.registrationLayout.waitingRow}>
                      {waitingPatients.map(wp => (
                        <span
                          key={wp.id}
                          className={MONITOR_STYLES.registrationLayout.waitingBadge}
                        >
                          {wp.patientNum}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}