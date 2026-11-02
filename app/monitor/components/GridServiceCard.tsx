/**
 * @fileoverview Compact, balanced grid card for 4 or more monitored services.
 *
 * Enforces zero dark mode, zero scrollbars, institutional typography,
 * balanced 50/50 sizing between Serving and Next Queue, and prohibition of pill boxes.
 *
 * @module app/monitor/components/GridServiceCard
 */

'use client';

import React from 'react';
import { CustomServiceQueue } from '@/app/monitor/hooks/useCustomMonitorData';

interface GridServiceCardProps {
  sq: CustomServiceQueue;
  totalServices: number;
}

function getEstimatedWait(position: number): string {
  switch (position) {
    case 1:
      return 'Est. ~3–5 mins';
    case 2:
      return '~6–10 mins';
    default:
      return `~${position * 5} mins`;
  }
}

/**
 * Renders an optimized grid card for multi-service TV monitors.
 * Serving and Next Queue have constant, equal 50/50 widths with pure typography and zero pill boxes.
 */
export function GridServiceCard({ sq, totalServices }: GridServiceCardProps) {
  const { id, service, displayTitle, displaySubcategory, openStationSummary, primaryServing, waitingQueue, totalWaitingCount } = sq;

  const ticketScale =
    totalServices === 4
      ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl'
      : totalServices <= 6
      ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'
      : totalServices <= 8
      ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'
      : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';

  return (
    <div
      key={id || service}
      className="flex flex-col h-full min-h-0 justify-between bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden"
    >
      {/* 1. Header Bar: Pure typography, zero pill boxes */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-slate-800 flex-shrink-0">
        <div className="flex items-baseline gap-1.5 min-w-0 pr-2">
          <span className="font-black text-xs sm:text-sm lg:text-base text-slate-900 tracking-wide uppercase truncate">
            {displayTitle || service}
          </span>
          {displaySubcategory && (
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider shrink-0">
              ({displaySubcategory})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-600 shrink-0">
          <span>{openStationSummary}</span>
          <span className="text-slate-300">•</span>
          <span className={totalWaitingCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}>
            {totalWaitingCount > 0 ? `${totalWaitingCount} in queue` : 'No queue'}
          </span>
        </div>
      </div>

      {/* 2. Body: Constant, equal 50/50 split between Serving and Next Queue */}
      <div className="flex-1 min-h-0 p-2 sm:p-2.5 grid grid-cols-2 gap-2 sm:gap-2.5 items-stretch overflow-hidden">
        {/* Left 50%: Now Serving */}
        {primaryServing ? (
          <div
            style={primaryServing.isCalling ? undefined : { backgroundColor: '#cc3535' }}
            className={`h-full min-h-0 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between items-center text-white relative overflow-hidden ${
              primaryServing.isCalling ? 'animate-monitor-calling shadow-lg' : 'shadow-md'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/90 animate-pulse pointer-events-none absolute top-2.5 right-2.5 z-10" />

            {/* Header: Pure text without pill background */}
            <div className="flex items-center gap-1.5 text-center flex-shrink-0">
              {primaryServing.isCalling ? (
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 flex items-center gap-1">
                  <i className="bx bxs-megaphone animate-bounce text-sm" aria-hidden="true" />
                  Calling Now
                </span>
              ) : (
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/90">
                  Now Serving
                </span>
              )}
              {primaryServing.isExtended && (
                <span className="text-xs font-bold text-amber-200">
                  (Extended)
                </span>
              )}
            </div>

            {/* Ticket: Prominent queue number */}
            <span className={`text-white font-black tabular-nums tracking-tight leading-none drop-shadow-sm my-auto text-center ${ticketScale}`}>
              {primaryServing.ticket}
            </span>

            {/* Destination: Direct clean text, no dark pill box */}
            <span className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-full tracking-wide">
              Proceed to {primaryServing.stationLabel}
              {primaryServing.doctorName ? ` (Dr. ${primaryServing.doctorName})` : ''}
            </span>
          </div>
        ) : (
          <div className="h-full min-h-0 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 text-slate-400">
              Now Serving
            </span>
            <span className="text-3xl sm:text-4xl font-bold text-slate-300">—</span>
          </div>
        )}

        {/* Right 50%: Next in Queue (Constant size, highly visible) */}
        <div className="h-full min-h-0 bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between items-center overflow-hidden">
          {/* Header: Pure text without pill background */}
          <div className="flex items-center justify-between w-full flex-shrink-0">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700">
              Next in Queue
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {waitingQueue.length > 0 ? getEstimatedWait(1) : ''}
            </span>
          </div>

          {/* Primary #1 in Line Ticket: Sized constantly and matching the serving scale */}
          <div className="flex flex-col items-center justify-center my-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              #1 in Line
            </span>
            <span className={`font-black text-slate-900 tabular-nums tracking-tight leading-none text-center ${ticketScale}`}>
              {waitingQueue[0]?.patientNum || '—'}
            </span>
          </div>

          {/* #2 in Line: Simple text row with border divider, zero nested pill boxes */}
          <div className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 pt-1 border-t border-slate-200 flex-shrink-0">
            <span>#2 in Line:</span>
            <span className="font-black text-slate-900 tabular-nums">
              {waitingQueue[1]?.patientNum || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
