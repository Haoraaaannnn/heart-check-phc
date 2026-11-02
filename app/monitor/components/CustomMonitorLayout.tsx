/**
 * @fileoverview Custom multi-service monitor layout for hospital public waiting displays.
 *
 * Dynamically adapts between:
 * 1. Stacked Layout (1 to 3 services): Full-width horizontal rows with large hero tickets.
 * 2. Responsive Grid Layout (4+ services): Balanced multi-column cards maximizing vertical
 *    height and readability without squeezed rows or viewport overflow.
 *
 * Enforces zero dark mode, zero scrollbars, and institutional solid surfaces.
 *
 * @module app/monitor/components/CustomMonitorLayout
 */

'use client';

import React, { useMemo } from 'react';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { CustomServiceQueue } from '@/app/monitor/hooks/useCustomMonitorData';
import { StackedServiceRow } from './StackedServiceRow';
import { GridServiceCard } from './GridServiceCard';

/** Props for {@link CustomMonitorLayout}. */
interface CustomMonitorLayoutProps {
  /** Aggregated service queues to display on the TV monitor. */
  serviceQueues: CustomServiceQueue[];
}

/**
 * Custom monitor display layout for hospital waiting displays.
 * Dynamically switches between:
 * - 1 to 3 services: Stacked full-width rows with enlarged hero tickets
 * - 4+ services: Responsive multi-column grid with balanced cards and zero scrollbars
 *
 * @param props - Component props containing aggregated service queues.
 * @returns The rendered monitor layout element.
 */
export function CustomMonitorLayout({ serviceQueues }: CustomMonitorLayoutProps) {
  const count = serviceQueues.length;

  const gridTemplate = useMemo(() => {
    if (count <= 3) return null;
    if (count === 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 8) return { cols: 4, rows: 2 };
    if (count === 9) return { cols: 3, rows: 3 };
    if (count === 10) return { cols: 5, rows: 2 };
    return { cols: 4, rows: Math.ceil(count / 4) };
  }, [count]);

  if (count === 0) {
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

  // 1 to 3 services: Stacked horizontal rows with large tickets
  if (!gridTemplate) {
    return (
      <div className={MONITOR_STYLES.stackedLayout.container}>
        {serviceQueues.map(sq => (
          <StackedServiceRow key={sq.id || sq.service} sq={sq} totalServices={count} />
        ))}
      </div>
    );
  }

  // 4+ services: Responsive multi-column grid with exact zero-scroll fit
  return (
    <div
      className="h-full w-full min-h-0 p-2 sm:p-3 lg:p-4 grid gap-2.5 sm:gap-3 lg:gap-3.5 overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${gridTemplate.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${gridTemplate.rows}, minmax(0, 1fr))`,
      }}
    >
      {serviceQueues.map(sq => (
        <GridServiceCard key={sq.id || sq.service} sq={sq} totalServices={count} />
      ))}
    </div>
  );
}
