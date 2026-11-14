/** @fileoverview Public registration counters retain existing patients while a staffed counter is on break. */
'use client';

import { Patient } from '@/types/Types';
import { fetchActiveCounters, fetchOccupiedCounters, type OccupiedCounterInfo } from '@/lib/counters';
import { visibleRegistrationCounters, isVisibleRegistrationPatient } from '@/app/monitor/lib/registrationVisibility';
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';
import { useMonitorCalls } from '@/app/monitor/hooks/useMonitorCalls';
import { playMonitorSpeech } from '@/app/monitor/lib/playMonitorSpeech';
import { DEFAULT_COUNTERS } from '@/lib/facilities';

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
  const [counterDirectory, setCounterDirectory] = useState<OccupiedCounterInfo[]>(() =>
    DEFAULT_COUNTERS.map(counter_number => ({
      counter_number,
      label: `Counter ${counter_number}`,
      active: true,
      on_break: false,
      occupied: false,
      services: [],
    }))
  );
  const livePatients = useMemo(() => patients.filter(isVisibleRegistrationPatient), [patients]);
  const counters = useMemo(() => {
    const activeCounters = visibleRegistrationCounters({
      counters: counterDirectory,
      patients: livePatients,
      showAllCounters: true,
    });
    return activeCounters.length > 0 ? activeCounters : DEFAULT_COUNTERS;
  }, [counterDirectory, livePatients]);
  const [activeCall, setActiveCall] = useState<{ ticket: string; counterNum: number; expiry: number } | null>(null);
  const [currentMs, setCurrentMs] = useState(Date.now);
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
    const load = () => fetchOccupiedCounters().then(counters => {
      if (counters && counters.length > 0) {
        setCounterDirectory(counters);
      }
    });
    load();
    const interval = setInterval(load, 5000);
    const channel = supabase.channel('registration-counter-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_counters' }, load)
      .subscribe();
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
        finally {
          if (pendingAnnouncements.current.length === 0) {
            setActiveCall(null);
          }
        }
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
      const counterInfo = counterDirectory.find(c => c.counter_number === counterNum);
      if (!counterInfo?.occupied || counterInfo.on_break) continue;
      const counterPatients = livePatients.filter(p => p.counter === counterNum);

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
  }, [livePatients, counters, counterDirectory]);

  const isFourCounters = counters.length === 4;

  if (isFourCounters) {
    return (
      <div className={MONITOR_STYLES.registrationLayout.container}>
        <div className={MONITOR_STYLES.registrationLayout.gridWrapper}>
          <div className={MONITOR_STYLES.registrationLayout.fourGridContainer}>
            {counters.map(counterNum => {
              const counterInfo = counterDirectory.find(c => c.counter_number === counterNum);
              const isOccupied = counterInfo ? counterInfo.occupied : false;
              const isOnBreak = counterInfo ? counterInfo.on_break : false;
              const isUnavailable = !isOccupied;

              const counterPatients = livePatients.filter(p => p.counter === counterNum);
              const activePatient = counterPatients[0];
              const waitingPatients = counterPatients.slice(1);
              const isCalling = !isUnavailable && activeCall !== null &&
                currentMs < activeCall.expiry &&
                (activeCall.counterNum === counterNum || (activePatient && activeCall.ticket === activePatient.patientNum));
              const isExtended = isExtendedIntake(activePatient, currentMs);

              return (
                <div key={counterNum} className={MONITOR_STYLES.registrationLayout.fourCounterCard}>
                  {/* Top Header with Counter Label and Queue Count or Status */}
                  <div className={MONITOR_STYLES.registrationLayout.counterHeader}>
                    <span className={MONITOR_STYLES.registrationLayout.counterHeaderLabel}>
                      {MONITOR_TEXTS.registrationLayout.counterLabelPrefix}{counterNum}
                    </span>
                    {isUnavailable ? (
                      <span className="bg-slate-200 border border-slate-300 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        Unavailable
                      </span>
                    ) : isOnBreak ? (
                      <span className="bg-amber-100 border border-amber-300 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        On Break
                      </span>
                    ) : (
                      <span className={MONITOR_STYLES.registrationLayout.counterHeaderCount}>
                        {waitingPatients.length > 0
                          ? `${waitingPatients.length}${MONITOR_TEXTS.registrationLayout.waitingCountSuffix}`
                          : MONITOR_TEXTS.registrationLayout.noWaiting}
                      </span>
                    )}
                  </div>

                  {/* Horizontal Split Body: Left Serving, Right Upcoming Roster */}
                  <div className={MONITOR_STYLES.registrationLayout.fourCardBody}>
                    {isUnavailable ? (
                      <div className="col-span-2 h-full min-h-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 text-center">
                        <i className="bx bx-user-x text-5xl sm:text-6xl text-slate-300 mb-2" aria-hidden="true" />
                        <span className="text-slate-500 font-black text-xl sm:text-2xl lg:text-3xl uppercase tracking-wider whitespace-nowrap">
                          Unavailable
                        </span>
                        <span className="text-slate-400 font-bold text-xs sm:text-sm mt-1 whitespace-nowrap">
                          No Staff Logged In
                        </span>
                        {waitingPatients.length > 0 && (
                          <span className="text-amber-700 font-semibold text-xs mt-3 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full whitespace-nowrap">
                            {waitingPatients.length} queued ticket{waitingPatients.length > 1 ? 's' : ''} awaiting staff
                          </span>
                        )}
                      </div>
                    ) : isOnBreak && !activePatient ? (
                      <div className="col-span-2 h-full min-h-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 text-center">
                        <i className="bx bx-coffee text-5xl sm:text-6xl text-amber-300 mb-2" aria-hidden="true" />
                        <span className="text-amber-800 font-black text-xl sm:text-2xl lg:text-3xl uppercase tracking-wider whitespace-nowrap">
                          On Break
                        </span>
                        <span className="text-amber-600/80 font-bold text-xs sm:text-sm mt-1 whitespace-nowrap">
                          Staff Temporarily Away
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Left Column: Active Patient / Now Serving */}
                        {activePatient ? (
                          <div
                            style={isCalling ? undefined : { backgroundColor: '#cc3535' }}
                            className={isCalling ? MONITOR_STYLES.registrationLayout.fourCallingCard : MONITOR_STYLES.registrationLayout.fourServingCard}
                          >
                            <div
                              className={MONITOR_STYLES.registrationLayout.activePulseDot}
                              aria-hidden="true"
                            />
                            <span className={isCalling ? MONITOR_STYLES.registrationLayout.nowCallingBadge : MONITOR_STYLES.registrationLayout.nowServingBadge}>
                              {isCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                              {isCalling ? MONITOR_TEXTS.registrationLayout.nowCallingBadge : MONITOR_TEXTS.registrationLayout.nowServingBadge}
                            </span>
                            <span className={MONITOR_STYLES.registrationLayout.fourServingTicket}>
                              {activePatient.patientNum}
                            </span>
                            {isExtended ? (
                              <span className={MONITOR_STYLES.registrationLayout.extendedBadge}>
                                <i className="bx bx-time-five" aria-hidden="true" />
                                {MONITOR_TEXTS.registrationLayout.extendedIntakeBadge}
                              </span>
                            ) : (
                              <div className="h-6 sm:h-7 invisible select-none pointer-events-none" aria-hidden="true" />
                            )}
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
                              {waitingPatients.length > 0
                                ? MONITOR_TEXTS.registrationLayout.nextInQueueSubLabel
                                : MONITOR_TEXTS.registrationLayout.noWaiting}
                            </span>
                          </div>

                          {/* Hero Next Ticket (Position 1 of waiting) */}
                          <div className={MONITOR_STYLES.registrationLayout.fourNextHeroCard}>
                            <div className="flex flex-col items-center justify-center my-auto">
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
                          </div>

                          {/* Position 2 of waiting: Second in line (only accept 3 numbers per queue including now serving) */}
                          <div className={MONITOR_STYLES.registrationLayout.fourSubQueueGrid}>
                            {[2].map(pos => {
                              const wp = waitingPatients[pos - 1];
                              return (
                                <div
                                  key={pos}
                                  className={wp ? MONITOR_STYLES.registrationLayout.fourSubQueueCard : MONITOR_STYLES.registrationLayout.fourSubQueueCardEmpty}
                                >
                                  <span className={wp ? MONITOR_STYLES.registrationLayout.fourSubQueuePosLabel : MONITOR_STYLES.registrationLayout.fourSubQueuePosLabelEmpty}>
                                    #{pos} in line
                                  </span>
                                  <span className={wp ? MONITOR_STYLES.registrationLayout.fourSubQueueTicket : MONITOR_STYLES.registrationLayout.fourSubQueueTicketEmpty}>
                                    {wp?.patientNum || MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                                  </span>
                                  <span className={wp ? MONITOR_STYLES.registrationLayout.fourSubQueueWait : MONITOR_STYLES.registrationLayout.fourSubQueueWaitEmpty}>
                                    {wp ? getEstimatedWait(pos) : MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Overflow indicator when more than 2 waiting patients are in the queue */}
                          {waitingPatients.length > 2 && (
                            <div className={MONITOR_STYLES.registrationLayout.fourMoreWaitingFooter}>
                              +{waitingPatients.length - 2}{MONITOR_TEXTS.registrationLayout.moreWaitingSuffix}
                            </div>
                          )}
                        </div>
                      </>
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

  // Default multi-column layout (e.g. 5 counters all side-by-side)
  return (
    <div className={MONITOR_STYLES.registrationLayout.container}>
      <div className={MONITOR_STYLES.registrationLayout.gridWrapper}>
        <div
          className={MONITOR_STYLES.registrationLayout.columnsContainer}
          style={{ gridTemplateColumns: `repeat(${Math.max(1, counters.length)}, minmax(0, 1fr))` }}
        >
          {counters.map(counterNum => {
            const counterInfo = counterDirectory.find(c => c.counter_number === counterNum);
            const isOccupied = counterInfo ? counterInfo.occupied : false;
            const isOnBreak = counterInfo ? counterInfo.on_break : false;
            const isUnavailable = !isOccupied;

            const counterPatients = livePatients.filter(p => p.counter === counterNum);
            const activePatient = counterPatients[0];
            const waitingPatients = counterPatients.slice(1);
            const isCalling = !isUnavailable && activeCall !== null &&
              currentMs < activeCall.expiry &&
              (activeCall.counterNum === counterNum || (activePatient && activeCall.ticket === activePatient.patientNum));
            const isExtended = isExtendedIntake(activePatient, currentMs);

            return (
              <div key={counterNum} className={MONITOR_STYLES.registrationLayout.counterColumn}>
                <div className={MONITOR_STYLES.registrationLayout.counterHeader}>
                  <span className={MONITOR_STYLES.registrationLayout.counterHeaderLabel}>
                    {MONITOR_TEXTS.registrationLayout.counterLabelPrefix}{counterNum}
                  </span>
                  {isUnavailable ? (
                    <span className="bg-slate-200 border border-slate-300 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      Unavailable
                    </span>
                  ) : isOnBreak ? (
                    <span className="bg-amber-100 border border-amber-300 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      On Break
                    </span>
                  ) : (
                    <span className={MONITOR_STYLES.registrationLayout.counterHeaderCount}>
                      {waitingPatients.length > 0
                        ? `${waitingPatients.length}${MONITOR_TEXTS.registrationLayout.waitingCountSuffix}`
                        : MONITOR_TEXTS.registrationLayout.noWaiting}
                    </span>
                  )}
                </div>

                <div className={MONITOR_STYLES.registrationLayout.cardBody}>
                  {isUnavailable ? (
                    <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 text-center">
                      <i className="bx bx-user-x text-4xl sm:text-5xl lg:text-6xl text-slate-300 mb-2" aria-hidden="true" />
                      <span className="text-slate-500 font-black text-lg sm:text-xl lg:text-2xl uppercase tracking-wider whitespace-nowrap">
                        Unavailable
                      </span>
                      <span className="text-slate-400 font-bold text-xs sm:text-sm mt-1 whitespace-nowrap">
                        No Staff Logged In
                      </span>
                      {waitingPatients.length > 0 && (
                        <span className="text-amber-700 font-semibold text-[11px] sm:text-xs mt-3 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {waitingPatients.length} queued ticket{waitingPatients.length > 1 ? 's' : ''} awaiting staff
                        </span>
                      )}
                    </div>
                  ) : isOnBreak && !activePatient ? (
                    <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 text-center">
                      <i className="bx bx-coffee text-4xl sm:text-5xl lg:text-6xl text-amber-300 mb-2" aria-hidden="true" />
                      <span className="text-amber-800 font-black text-lg sm:text-xl lg:text-2xl uppercase tracking-wider whitespace-nowrap">
                        On Break
                      </span>
                      <span className="text-amber-600/80 font-bold text-xs sm:text-sm mt-1 whitespace-nowrap">
                        Staff Temporarily Away
                      </span>
                    </div>
                  ) : (
                    <>
                      {activePatient ? (
                        <div
                          style={isCalling ? undefined : { backgroundColor: '#cc3535' }}
                          className={isCalling ? MONITOR_STYLES.registrationLayout.callingCard : MONITOR_STYLES.registrationLayout.nowServingCard}
                        >
                          <div
                            className={MONITOR_STYLES.registrationLayout.activePulseDot}
                            aria-hidden="true"
                          />
                          <span className={isCalling ? MONITOR_STYLES.registrationLayout.nowCallingBadge : MONITOR_STYLES.registrationLayout.nowServingBadge}>
                            {isCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                            {isCalling ? MONITOR_TEXTS.registrationLayout.nowCallingBadge : MONITOR_TEXTS.registrationLayout.nowServingBadge}
                          </span>
                          <span className={MONITOR_STYLES.registrationLayout.nowServingTicket}>
                            {activePatient.patientNum}
                          </span>
                          {isExtended ? (
                            <span className={MONITOR_STYLES.registrationLayout.extendedBadge}>
                              <i className="bx bx-time-five" aria-hidden="true" />
                              {MONITOR_TEXTS.registrationLayout.extendedIntakeBadge}
                            </span>
                          ) : (
                            <div className="h-5 sm:h-6 invisible select-none pointer-events-none" aria-hidden="true" />
                          )}
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

                        {/* Position 2 of waiting: Ordered Sub-queue (only accept 3 numbers per queue including now serving) */}
                        <div className={MONITOR_STYLES.registrationLayout.columnUpcomingRoster}>
                          {[2].map(pos => {
                            const wp = waitingPatients[pos - 1];
                            return wp ? (
                              <div key={wp.id} className={MONITOR_STYLES.registrationLayout.columnUpcomingRow}>
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="text-slate-500 font-bold text-xs sm:text-sm whitespace-nowrap">
                                    #{pos} in line
                                  </span>
                                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 whitespace-nowrap hidden lg:inline">
                                    ({getEstimatedWait(pos)})
                                  </span>
                                </div>
                                <span className="font-black text-slate-900 tabular-nums text-base sm:text-lg lg:text-xl tracking-tight">
                                  {wp.patientNum}
                                </span>
                              </div>
                            ) : (
                              <div key={pos} className={MONITOR_STYLES.registrationLayout.columnUpcomingRowEmpty}>
                                <span className="text-slate-400 font-semibold text-xs sm:text-sm">
                                  #{pos} in line
                                </span>
                                <span className="text-slate-300 font-bold text-sm sm:text-base tabular-nums">
                                  {MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                                </span>
                              </div>
                            );
                          })}
                          {waitingPatients.length > 2 && (
                            <div className="text-center text-[10px] sm:text-[11px] font-bold text-slate-500 py-0.5 flex-shrink-0">
                              +{waitingPatients.length - 2} more waiting
                            </div>
                          )}
                        </div>
                      </div>
                    </>
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
