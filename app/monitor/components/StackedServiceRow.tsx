/**
 * @fileoverview Full-width stacked row component for 1 to 3 monitored services.
 *
 * Enforces zero dark mode, zero scrollbars, institutional typography,
 * balanced constant sizing between Serving and Next Queue, and prohibition of pill boxes.
 *
 * @module app/monitor/components/StackedServiceRow
 */

'use client';

import React from 'react';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';
import { CustomServiceQueue } from '@/app/monitor/hooks/useCustomMonitorData';

interface StackedServiceRowProps {
  sq: CustomServiceQueue;
  totalServices: number;
}

function getEstimatedWait(position: number): string {
  switch (position) {
    case 1:
      return MONITOR_TEXTS.registrationLayout.estWaitNext;
    case 2:
      return '~6–10 mins';
    case 3:
      return '~10–15 mins';
    default:
      return `~${position * 5} mins`;
  }
}

/**
 * Renders a full-width horizontal row for 1 to 3 selected services.
 * Serving and Next in Queue cards share equal constant widths with pure typography and zero pill boxes.
 */
export function StackedServiceRow({ sq, totalServices }: StackedServiceRowProps) {
  const { id, service, displayTitle, displaySubcategory, openStationSummary, primaryServing, waitingQueue, totalWaitingCount } = sq;

  const ticketScale =
    totalServices === 1
      ? 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] 2xl:text-[11rem]'
      : totalServices === 2
      ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl 2xl:text-[10rem]'
      : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl 2xl:text-9xl';

  return (
    <div key={id || service} className={MONITOR_STYLES.stackedLayout.serviceRow}>
      {/* 1. Left: Service Identity & Status Summary (Pure typography, zero pill boxes) */}
      <div className="w-[22%] sm:w-[20%] flex-shrink-0 bg-slate-100 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex flex-col min-w-0">
          <h2 className="font-black text-slate-900 text-base sm:text-lg lg:text-xl uppercase tracking-wider break-words leading-tight">
            {displayTitle || service}
          </h2>
          {displaySubcategory && (
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide mt-0.5">
              ({displaySubcategory})
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-slate-200 text-xs sm:text-sm text-slate-600 font-semibold">
          <span>{openStationSummary}</span>
          <span className={totalWaitingCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}>
            {totalWaitingCount > 0 ? `${totalWaitingCount} in queue` : 'No waiting queue'}
          </span>
        </div>
      </div>

      {/* 2. Center: Large Highlighted Now Serving Card (Equal constant width, zero pill boxes) */}
      {primaryServing ? (
        <div
          style={primaryServing.isCalling ? undefined : { backgroundColor: '#cc3535' }}
          className={`flex-1 min-h-0 h-full rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between items-center text-white relative overflow-hidden ${
            primaryServing.isCalling ? 'animate-monitor-calling shadow-2xl' : 'shadow-lg'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white/90 animate-pulse pointer-events-none absolute top-3 right-3 z-10" />

          {/* Header label: Direct clean typography */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {primaryServing.isCalling ? (
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />
                Calling Now
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/95">
                Now Serving
              </span>
            )}
            {primaryServing.isExtended && (
              <span className="text-xs font-bold text-amber-200">
                (Extended Intake)
              </span>
            )}
          </div>

          {/* Ticket Number */}
          <span className={`text-white font-black tabular-nums tracking-tight leading-none drop-shadow-md my-auto text-center ${ticketScale}`}>
            {primaryServing.ticket}
          </span>

          {/* Destination: Direct clean text, no dark pill box */}
          <span className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-full tracking-wide">
            Proceed to {primaryServing.stationLabel}
            {primaryServing.doctorName ? ` (Dr. ${primaryServing.doctorName})` : ''}
          </span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-slate-400">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 text-slate-400">
            Now Serving
          </span>
          <span className="text-4xl font-bold text-slate-300">—</span>
        </div>
      )}

      {/* 3. Right: Next in Queue Card (Equal constant width to Serving, zero pill boxes) */}
      <div className="flex-1 min-h-0 h-full bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
        {/* Header label: Direct clean blue text */}
        <div className="flex items-center justify-between w-full flex-shrink-0">
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700">
            Next in Queue
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {waitingQueue.length > 0 ? getEstimatedWait(1) : 'No waiting queue'}
          </span>
        </div>

        {/* Primary #1 in line hero ticket: Constant sizing matching the serving card */}
        <div className="flex flex-col items-center justify-center my-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            #1 in Line
          </span>
          <span className={`text-slate-900 font-black tabular-nums tracking-tight leading-none text-center ${ticketScale}`}>
            {waitingQueue[0]?.patientNum || '—'}
          </span>
        </div>

        {/* #2 in line: Direct clean typography with top border, zero pill boxes */}
        <div className="flex items-center justify-between w-full text-xs sm:text-sm font-semibold text-slate-600 pt-1.5 border-t border-slate-200 flex-shrink-0">
          <span>#2 in Line:</span>
          <span className="font-black text-slate-900 tabular-nums">
            {waitingQueue[1]?.patientNum || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
