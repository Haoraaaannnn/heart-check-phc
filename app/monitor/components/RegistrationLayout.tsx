/** @fileoverview Public registration counters excluding administrative closures and staff breaks. */
'use client';

import { Patient } from '@/types/Types';
import { fetchActiveCounters } from '@/lib/counters';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';
import { useMonitorCalls } from '@/app/monitor/hooks/useMonitorCalls';
import { playMonitorSpeech } from '@/app/monitor/lib/playMonitorSpeech';

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
  const [counters, setCounters] = useState<number[]>([]);
  const announcedPatientsRef = useRef<Set<number>>(new Set());
  const isProcessing = useRef(false);
  const pendingAnnouncements = useRef<{ ticket: string; counterNum: number; message?: string; expiresAt?: string }[]>([]);
  const audioController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    audioController.current = controller;
    return () => { controller.abort(); pendingAnnouncements.current = []; };
  }, []);

  useEffect(() => {
    const load = () => fetchActiveCounters().then(setCounters);
    load();
    const interval = setInterval(load, 5000);
    const channel = supabase.channel('registration-counter-breaks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, load).subscribe();
    return () => { clearInterval(interval); void supabase.removeChannel(channel); };
  }, []);

  /** Serializes automatic intake announcements and manual registration recalls. */
  const processAnnouncements = async () => {
    if (isProcessing.current || !audioController.current || audioController.current.signal.aborted) return;
    const controller = audioController.current;
    isProcessing.current = true;
    try {
      while (pendingAnnouncements.current.length && !controller.signal.aborted) {
        const item = pendingAnnouncements.current.shift()!;
        if (item.expiresAt && Date.parse(item.expiresAt) <= Date.now()) continue;
        const available = await fetchActiveCounters();
        if (!available.includes(item.counterNum)) continue;
        const ticket = formatTicketForSpeech(item.ticket);
        const message = item.message ?? `Number ${ticket}, Number ${ticket}, please proceed to Counter ${item.counterNum}`;
        try { await playMonitorSpeech(message, 2, controller.signal); }
        catch (error) { if (!controller.signal.aborted) console.warn('Registration monitor call failed:', error); }
      }
    } finally { isProcessing.current = false; }
  };

  useMonitorCalls('Registration', null, true, call => {
    if (call.counter === null) return;
    pendingAnnouncements.current.push({ ticket: call.ticket, counterNum: call.counter, message: call.message, expiresAt: call.expiresAt });
    void processAnnouncements();
  });

  useEffect(() => {
    const newAnnouncements: { ticket: string; counterNum: number }[] = [];

    for (const counterNum of counters) {
      const counterPatients = patients.filter(p => p.counter === counterNum);

      if (counterPatients.length > 0) {
        const topPatient = counterPatients[0];

        if (!announcedPatientsRef.current.has(topPatient.id)) {
          announcedPatientsRef.current.add(topPatient.id);
          newAnnouncements.push({ ticket: topPatient.patientNum, counterNum });
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
