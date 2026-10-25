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

/**
 * Determines whether an active intake transaction has exceeded the normal 5-minute threshold.
 *
 * @param patient - Current patient actively being served at the counter.
 * @param currentTimeMs - Current timestamp in milliseconds.
 * @returns True if elapsed duration exceeds 5 minutes.
 */
function isExtendedIntake(patient?: Patient | null, currentTimeMs = Date.now()): boolean {
  if (!patient) return false;
  const startTime = patient.reg_start || patient.called_at || patient.progress_started_at || patient.created_at;
  if (!startTime) return false;
  const startMs = new Date(startTime).getTime();
  if (isNaN(startMs)) return false;
  return (currentTimeMs - startMs) > 5 * 60 * 1000;
}

/**
 * Returns the estimated wait range string for a given queue position in line.
 *
 * @param position - 1-indexed position in line (1 = next in queue).
 * @returns Human-readable estimated wait duration range.
 */
function getEstimatedWait(position: number): string {
  switch (position) {
    case 1:
      return MONITOR_TEXTS.registrationLayout.estWaitNext;
    case 2:
      return '~6–10 mins';
    case 3:
      return '~10–15 mins';
    case 4:
      return '~15–20 mins';
    default:
      return `~${position * 5} mins`;
  }
}

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
  const [activeCall, setActiveCall] = useState<{ ticket: string; counterNum: number; expiry: number } | null>(null);
  const [currentMs, setCurrentMs] = useState(Date.now());
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
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentMs(now);
      setActiveCall(prev => {
        if (!prev) return null;
        return now < prev.expiry ? prev : null;
      });
    }, 2000);
    return () => clearInterval(timer);
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
        setActiveCall({ ticket: item.ticket, counterNum: item.counterNum, expiry: Date.now() + 15000 });
        try { await playMonitorSpeech(message, 2, controller.signal); }
        catch (error) { if (!controller.signal.aborted) console.warn('Registration monitor call failed:', error); }
      }
    } finally { isProcessing.current = false; }
  };

  useMonitorCalls('Registration', null, true, call => {
    if (call.counter === null) return;
    setActiveCall({ ticket: call.ticket, counterNum: call.counter, expiry: Date.now() + 15000 });
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
      const latest = newAnnouncements[newAnnouncements.length - 1];
      setActiveCall({ ticket: latest.ticket, counterNum: latest.counterNum, expiry: Date.now() + 15000 });
      pendingAnnouncements.current.push(...newAnnouncements);
      processAnnouncements();
    }
  }, [patients, counters]);

  const isFourCounters = counters.length === 4;

  if (isFourCounters) {
    return (
      <div className={MONITOR_STYLES.registrationLayout.container}>
        <div className={MONITOR_STYLES.registrationLayout.gridWrapper}>
          <div className={MONITOR_STYLES.registrationLayout.fourGridContainer}>
            {counters.map(counterNum => {
              const counterPatients = patients.filter(p => p.counter === counterNum);
              const activePatient = counterPatients[0];
              const waitingPatients = counterPatients.slice(1);
              const isCalling = activeCall !== null &&
                Date.now() < activeCall.expiry &&
                (activeCall.counterNum === counterNum || (activePatient && activeCall.ticket === activePatient.patientNum));
              const isExtended = isExtendedIntake(activePatient, currentMs);

              return (
                <div key={counterNum} className={MONITOR_STYLES.registrationLayout.fourCounterCard}>
                  {/* Top Header with Counter Label and Queue Count */}
                  <div className={MONITOR_STYLES.registrationLayout.counterHeader}>
                    <span className={MONITOR_STYLES.registrationLayout.counterHeaderLabel}>
                      {MONITOR_TEXTS.registrationLayout.counterLabelPrefix}{counterNum}
                    </span>
                    <span className={MONITOR_STYLES.registrationLayout.counterHeaderCount}>
                      {waitingPatients.length > 0
                        ? `${waitingPatients.length}${MONITOR_TEXTS.registrationLayout.waitingCountSuffix}`
                        : MONITOR_TEXTS.registrationLayout.noWaiting}
                    </span>
                  </div>

                  {/* Horizontal Split Body: Left Serving, Right Upcoming Roster */}
                  <div className={MONITOR_STYLES.registrationLayout.fourCardBody}>
                    {/* Left Column: Active Patient / Now Serving */}
                    {activePatient ? (
                      <div
                        style={isCalling ? undefined : { backgroundColor: '#cc3535' }}
                        className={isCalling ? MONITOR_STYLES.registrationLayout.fourCallingCard : MONITOR_STYLES.registrationLayout.fourServingCard}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1">
                          <span className={isCalling ? MONITOR_STYLES.registrationLayout.nowCallingBadge : MONITOR_STYLES.registrationLayout.nowServingBadge}>
                            {isCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                            {isCalling ? MONITOR_TEXTS.registrationLayout.nowCallingBadge : MONITOR_TEXTS.registrationLayout.nowServingBadge}
                          </span>
                          {isExtended && (
                            <span className={MONITOR_STYLES.registrationLayout.extendedBadge}>
                              <i className="bx bx-time-five" aria-hidden="true" />
                              {MONITOR_TEXTS.registrationLayout.extendedIntakeBadge}
                            </span>
                          )}
                        </div>
                        <span className={MONITOR_STYLES.registrationLayout.fourServingTicket}>
                          {activePatient.patientNum}
                        </span>
                        <div
                          className={MONITOR_STYLES.registrationLayout.activePulseDot}
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <div className={MONITOR_STYLES.registrationLayout.fourEmptyCounterCard}>
                        {MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                      </div>
                    )}

                    {/* Right Column: High-Transparency Upcoming Queue */}
                    <div className={MONITOR_STYLES.registrationLayout.fourUpcomingCard}>
                      <div className={MONITOR_STYLES.registrationLayout.nextQueueHeader}>
                        <span className={MONITOR_STYLES.registrationLayout.nextBadge}>
                          {MONITOR_TEXTS.registrationLayout.nextInQueueBadge}
                        </span>
                        <span className={MONITOR_STYLES.registrationLayout.nextSubLabel}>
                          {MONITOR_TEXTS.registrationLayout.nextInQueueSubLabel}
                        </span>
                      </div>

                      {/* Hero Next Ticket (Position 1 of waiting) */}
                      <div className={MONITOR_STYLES.registrationLayout.fourNextHeroCard}>
                        <span className={MONITOR_STYLES.registrationLayout.fourNextTicket}>
                          {waitingPatients[0]?.patientNum || MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                        </span>
                        {waitingPatients.length > 0 && (
                          <span className={isExtended ? MONITOR_STYLES.registrationLayout.estWaitHeroExtended : MONITOR_STYLES.registrationLayout.estWaitHero}>
                            {isExtended ? (
                              <>
                                <i className="bx bx-time-five animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
                                {MONITOR_TEXTS.registrationLayout.estWaitNextExtended}
                              </>
                            ) : (
                              MONITOR_TEXTS.registrationLayout.estWaitNext
                            )}
                          </span>
                        )}
                      </div>

                      {/* When only 1 waiting (or 0), show clean "No waiting queue" centered below hero card (matches screenshot standard) */}
                      {waitingPatients.length <= 1 ? (
                        <div className="flex-1 flex items-center justify-center text-xs sm:text-sm text-slate-400 font-medium">
                          {MONITOR_TEXTS.registrationLayout.noWaiting}
                        </div>
                      ) : (
                        /* When 2 to 4 waiting, show upcoming roster */
                        <div className={MONITOR_STYLES.registrationLayout.fourUpcomingRoster}>
                          {waitingPatients.slice(1, 4).map((wp, idx) => (
                            <div key={wp.id} className={MONITOR_STYLES.registrationLayout.fourUpcomingRow}>
                              <span className="text-slate-600 font-bold">
                                #{idx + 2} in line
                                <span className={MONITOR_STYLES.registrationLayout.estWaitRowTag}>
                                  ({getEstimatedWait(idx + 2)})
                                </span>
                              </span>
                              <span className="font-black text-slate-800 text-sm sm:text-base tabular-nums">
                                {wp.patientNum}
                              </span>
                            </div>
                          ))}
                          {waitingPatients.length > 4 && (
                            <div className="text-center text-[11px] font-bold text-slate-400 py-0.5">
                              +{waitingPatients.length - 4} more waiting
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default multi-column layout (e.g. 5 counters all side-by-side)
  return (
    <div className={MONITOR_STYLES.registrationLayout.container}>
      <div className={MONITOR_STYLES.registrationLayout.gridWrapper}>
        <div
          className={MONITOR_STYLES.registrationLayout.columnsContainer}
          style={{ gridTemplateColumns: `repeat(${Math.max(1, counters.length)}, minmax(0, 1fr))` }}
        >
          {counters.map(counterNum => {
            const counterPatients = patients.filter(p => p.counter === counterNum);
            const activePatient = counterPatients[0];
            const waitingPatients = counterPatients.slice(1);
            const isCalling = activeCall !== null &&
              Date.now() < activeCall.expiry &&
              (activeCall.counterNum === counterNum || (activePatient && activeCall.ticket === activePatient.patientNum));
            const isExtended = isExtendedIntake(activePatient, currentMs);

            return (
              <div key={counterNum} className={MONITOR_STYLES.registrationLayout.counterColumn}>
                <div className={MONITOR_STYLES.registrationLayout.counterHeader}>
                  <span className={MONITOR_STYLES.registrationLayout.counterHeaderLabel}>
                    {MONITOR_TEXTS.registrationLayout.counterLabelPrefix}{counterNum}
                  </span>
                  <span className={MONITOR_STYLES.registrationLayout.counterHeaderCount}>
                    {waitingPatients.length > 0
                      ? `${waitingPatients.length}${MONITOR_TEXTS.registrationLayout.waitingCountSuffix}`
                      : MONITOR_TEXTS.registrationLayout.noWaiting}
                  </span>
                </div>

                <div className={MONITOR_STYLES.registrationLayout.cardBody}>
                  {activePatient ? (
                    <div
                      style={isCalling ? undefined : { backgroundColor: '#cc3535' }}
                      className={isCalling ? MONITOR_STYLES.registrationLayout.callingCard : MONITOR_STYLES.registrationLayout.nowServingCard}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1">
                        <span className={isCalling ? MONITOR_STYLES.registrationLayout.nowCallingBadge : MONITOR_STYLES.registrationLayout.nowServingBadge}>
                          {isCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                          {isCalling ? MONITOR_TEXTS.registrationLayout.nowCallingBadge : MONITOR_TEXTS.registrationLayout.nowServingBadge}
                        </span>
                        {isExtended && (
                          <span className={MONITOR_STYLES.registrationLayout.extendedBadge}>
                            <i className="bx bx-time-five" aria-hidden="true" />
                            {MONITOR_TEXTS.registrationLayout.extendedIntakeBadge}
                          </span>
                        )}
                      </div>
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

                  {/* Lower Upcoming Queue Box: 4 waiting tickets (Positions #1 to #4) */}
                  <div className={MONITOR_STYLES.registrationLayout.nextQueueCard}>
                    <div className={MONITOR_STYLES.registrationLayout.nextQueueHeader}>
                      <span className={MONITOR_STYLES.registrationLayout.nextBadge}>
                        {MONITOR_TEXTS.registrationLayout.nextInQueueBadge}
                      </span>
                      <span className={MONITOR_STYLES.registrationLayout.nextSubLabel}>
                        {waitingPatients.length > 0
                          ? MONITOR_TEXTS.registrationLayout.nextInQueueSubLabel
                          : MONITOR_TEXTS.registrationLayout.noWaiting}
                      </span>
                    </div>

                    {/* Position 1 of waiting: Hero Next Ticket */}
                    <div className={MONITOR_STYLES.registrationLayout.nextHeroCard}>
                      <div className="flex flex-col min-w-0">
                        <span className={MONITOR_STYLES.registrationLayout.nextHeroBadge}>
                          #1 {MONITOR_TEXTS.registrationLayout.nextInQueueBadge}
                        </span>
                        {waitingPatients.length > 0 && (
                          <span className={isExtended ? "text-[10px] font-bold text-amber-700 animate-pulse mt-0.5" : "text-[10px] font-semibold text-slate-500 mt-0.5"}>
                            {isExtended ? MONITOR_TEXTS.registrationLayout.estWaitNextExtended : MONITOR_TEXTS.registrationLayout.estWaitNext}
                          </span>
                        )}
                      </div>
                      <span className={MONITOR_STYLES.registrationLayout.nextHeroTicket}>
                        {waitingPatients[0]?.patientNum || MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                      </span>
                    </div>

                    {/* Positions 2, 3, 4 of waiting: Ordered Sub-queue Roster */}
                    <div className={MONITOR_STYLES.registrationLayout.columnUpcomingRoster}>
                      {[2, 3, 4].map(pos => {
                        const wp = waitingPatients[pos - 1];
                        return wp ? (
                          <div key={wp.id} className={MONITOR_STYLES.registrationLayout.columnUpcomingRow}>
                            <span className="text-slate-500 font-bold">
                              #{pos} in line
                              <span className={MONITOR_STYLES.registrationLayout.estWaitRowTag}>
                                ({getEstimatedWait(pos)})
                              </span>
                            </span>
                            <span className="font-black text-slate-800 tabular-nums text-xs sm:text-sm">
                              {wp.patientNum}
                            </span>
                          </div>
                        ) : (
                          <div key={pos} className={MONITOR_STYLES.registrationLayout.columnUpcomingRowEmpty}>
                            <span className="text-slate-400 font-semibold">
                              #{pos} in line
                            </span>
                            <span className="text-slate-300 font-bold">
                              {MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                            </span>
                          </div>
                        );
                      })}
                      {waitingPatients.length > 4 && (
                        <div className="text-center text-[10px] sm:text-[11px] font-bold text-slate-400 py-0.5 flex-shrink-0">
                          +{waitingPatients.length - 4} more waiting
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
