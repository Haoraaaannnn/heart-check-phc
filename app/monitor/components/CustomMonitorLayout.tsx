/**
 * @fileoverview Custom multi-service monitor layout for hospital public waiting displays.
 *
 * Stacks services vertically in clean, full-width horizontal rows to avoid narrow
 * multi-column squishing. Each service row features:
 * - Service identification with open station summary and total queue count
 * - Large, highlighted Now Serving card with active calling alert and destination callout
 * - Next in queue roster displaying a prominent #1 hero ticket and minimum 4 upcoming queues.
 *
 * Enforces zero dark mode, zero scrollbars, and institutional solid surfaces.
 *
 * @module app/monitor/components/CustomMonitorLayout
 */

'use client';

import React from 'react';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';
import { CustomServiceQueue } from '@/app/monitor/hooks/useCustomMonitorData';

/** Props for {@link CustomMonitorLayout}. */
interface CustomMonitorLayoutProps {
  /** Aggregated service queues stacked vertically. */
  serviceQueues: CustomServiceQueue[];
}

/**
 * Returns estimated wait time string based on position in queue.
 * @param position - 1-indexed queue position.
 * @returns Human-readable wait estimate.
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

/**
 * Custom monitor display layout stacking multiple services vertically.
 * Dynamically scales across 1 to 5+ selected services without scrollbars.
 *
 * @param props - Component props containing aggregated service queues.
 * @returns The rendered monitor layout element.
 */
export function CustomMonitorLayout({ serviceQueues }: CustomMonitorLayoutProps) {
  if (serviceQueues.length === 0) {
    return (
      <div className={MONITOR_STYLES.stackedLayout.container}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <i className="bx bx-store-alt text-6xl text-slate-300 mb-4" aria-hidden="true" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-600 mb-2">
            No Active Services Selected
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-400 max-w-md">
            Please return to the monitor selector and pick one or more clinical services or counters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={MONITOR_STYLES.stackedLayout.container}>
      {serviceQueues.map(sq => {
        const { id, service, displayTitle, displaySubcategory, openStationSummary, primaryServing, otherServing, waitingQueue, totalWaitingCount, isCalling } = sq;
        const remainingWaiting = totalWaitingCount > 4 ? totalWaitingCount - 4 : 0;

        return (
          <div key={id || service} className={MONITOR_STYLES.stackedLayout.serviceRow}>
            {/* Left: Service Identity & Station Summary */}
            <div className={MONITOR_STYLES.stackedLayout.serviceIdentityCard}>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className={MONITOR_STYLES.stackedLayout.serviceBadge}>
                    Service
                  </span>
                  {displaySubcategory && (
                    <span className={displaySubcategory.toLowerCase() === 'pedia' ? MONITOR_STYLES.stackedLayout.pediaBadge : MONITOR_STYLES.stackedLayout.adultBadge}>
                      {displaySubcategory}
                    </span>
                  )}
                </div>
                <h2 className={MONITOR_STYLES.stackedLayout.serviceTitle}>
                  {displayTitle || service}
                </h2>
              </div>

              <div className={MONITOR_STYLES.stackedLayout.serviceMetaWrap}>
                <span className={MONITOR_STYLES.stackedLayout.stationsCount}>
                  {openStationSummary}
                </span>
                <span className={MONITOR_STYLES.stackedLayout.queueBadge}>
                  {totalWaitingCount > 0 ? `${totalWaitingCount} in queue` : 'No waiting'}
                </span>
              </div>
            </div>

            {/* Center: Large Highlighted Now Serving Card */}
            {primaryServing ? (
              <div
                style={primaryServing.isCalling ? undefined : { backgroundColor: '#cc3535' }}
                className={primaryServing.isCalling ? MONITOR_STYLES.stackedLayout.callingCard : MONITOR_STYLES.stackedLayout.nowServingCard}
              >
                <div
                  className={MONITOR_STYLES.registrationLayout.activePulseDot}
                  aria-hidden="true"
                />
                
                {/* Calling / Serving Badge */}
                <div className="flex items-center gap-2">
                  <span className={primaryServing.isCalling ? MONITOR_STYLES.registrationLayout.nowCallingBadge : MONITOR_STYLES.registrationLayout.nowServingBadge}>
                    {primaryServing.isCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                    {primaryServing.isCalling ? MONITOR_TEXTS.registrationLayout.nowCallingBadge : MONITOR_TEXTS.registrationLayout.nowServingBadge}
                  </span>
                  {primaryServing.isExtended && (
                    <span className={MONITOR_STYLES.registrationLayout.extendedBadge}>
                      <i className="bx bx-time-five" aria-hidden="true" />
                      {MONITOR_TEXTS.registrationLayout.extendedIntakeBadge}
                    </span>
                  )}
                </div>

                {/* Primary Serving Ticket */}
                <span className={MONITOR_STYLES.stackedLayout.nowServingTicket}>
                  {primaryServing.ticket}
                </span>

                {/* Destination Badge */}
                <span className={MONITOR_STYLES.stackedLayout.destinationBadge}>
                  Proceed to {primaryServing.stationLabel}
                  {primaryServing.doctorName ? ` (Dr. ${primaryServing.doctorName})` : ''}
                </span>

                {/* Other Active Stations Serving in this Service */}
                {otherServing.length > 0 && (
                  <div className={MONITOR_STYLES.stackedLayout.otherServingStrip}>
                    {otherServing.slice(0, 4).map(os => (
                      <span key={os.stationLabel} className={MONITOR_STYLES.stackedLayout.otherServingPill}>
                        {os.stationLabel}: #{os.ticket}
                      </span>
                    ))}
                    {otherServing.length > 4 && (
                      <span className={MONITOR_STYLES.stackedLayout.otherServingPill}>
                        +{otherServing.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={MONITOR_STYLES.stackedLayout.emptyServingCard}>
                <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Now Serving
                </span>
                <span>{MONITOR_TEXTS.registrationLayout.emptyPlaceholder}</span>
              </div>
            )}

            {/* Right: Next in Queue Card (Hero #1 + #2, #3, #4 in line) */}
            <div className={MONITOR_STYLES.stackedLayout.nextQueueCard}>
              <div className={MONITOR_STYLES.customLayout.nextQueueHeader}>
                <span className={MONITOR_STYLES.customLayout.nextBadge}>
                  {MONITOR_TEXTS.registrationLayout.nextInQueueBadge}
                </span>
                <span className={MONITOR_STYLES.customLayout.nextSubLabel}>
                  {totalWaitingCount > 0 ? `${totalWaitingCount} waiting` : MONITOR_TEXTS.registrationLayout.noWaiting}
                </span>
              </div>

              {/* Position #1 Hero Card */}
              <div className={MONITOR_STYLES.stackedLayout.nextHeroCard}>
                <div className="flex flex-col min-w-0">
                  <span className={MONITOR_STYLES.customLayout.nextHeroBadge}>
                    #1 {MONITOR_TEXTS.registrationLayout.nextInQueueBadge}
                  </span>
                  {waitingQueue.length > 0 && (
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                      {getEstimatedWait(1)}
                    </span>
                  )}
                </div>
                <span className={MONITOR_STYLES.stackedLayout.nextHeroTicket}>
                  {waitingQueue[0]?.patientNum || MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                </span>
              </div>

              {/* Positions #2, #3, #4 Sub-queue Grid */}
              <div className={MONITOR_STYLES.stackedLayout.subQueueGrid}>
                {[2, 3, 4].map(pos => {
                  const wp = waitingQueue[pos - 1];
                  return wp ? (
                    <div key={wp.id} className={MONITOR_STYLES.stackedLayout.subQueueCard}>
                      <span className={MONITOR_STYLES.stackedLayout.subQueueLabel}>
                        #{pos} in line
                      </span>
                      <span className={MONITOR_STYLES.stackedLayout.subQueueTicket}>
                        {wp.patientNum}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 leading-none">
                        {getEstimatedWait(pos)}
                      </span>
                    </div>
                  ) : (
                    <div key={pos} className={MONITOR_STYLES.stackedLayout.subQueueCardEmpty}>
                      <span className={MONITOR_STYLES.stackedLayout.subQueueLabel}>
                        #{pos} in line
                      </span>
                      <span className={MONITOR_STYLES.stackedLayout.subQueueTicketEmpty}>
                        {MONITOR_TEXTS.registrationLayout.emptyPlaceholder}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-transparent leading-none">
                        --
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Overflow Indicator */}
              {remainingWaiting > 0 && (
                <div className={MONITOR_STYLES.stackedLayout.moreWaitingFooter}>
                  +{remainingWaiting} more waiting in queue
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
