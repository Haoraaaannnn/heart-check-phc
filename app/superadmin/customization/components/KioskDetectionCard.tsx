/**
 * @fileoverview SuperAdmin Kiosk Terminal Detection and Hardware Health Telemetry Card.
 *
 * Displays live counts of active touchscreens, active screen locations, and connected
 * thermal receipt printer hardware state across outpatient hospital kiosks.
 *
 * @module app/superadmin/customization/components/KioskDetectionCard
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useKioskPresenceMonitor } from '@/app/superadmin/customization/hooks/useKioskPresenceMonitor';
import { KioskPresencePayload } from '@/types/kioskPresence';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';
import { CUSTOMIZATION_STYLES } from '@/app/superadmin/customization/constants/customizationStyles';

/**
 * Formats an ISO timestamp into a local 12-hour time string.
 *
 * @param isoString - ISO formatted timestamp.
 * @returns Human-readable time (e.g. '03:15:20 PM').
 */
function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'Just now';
  }
}

/**
 * Renders status chip for a kiosk terminal.
 */
function KioskStatusBadge({ status }: { status: KioskPresencePayload['status'] }) {
  if (status === 'printing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
        <i className="bx bx-printer animate-bounce text-sm" aria-hidden="true" />
        <span>Printing Ticket</span>
      </span>
    );
  }

  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>Actively Browsing</span>
      </span>
    );
  }

  if (status === 'idle') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
        <i className="bx bx-time-five text-sm" aria-hidden="true" />
        <span>Idle</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#242424] dark:text-[#f5f5f5] dark:border-[#383838]">
      <i className="bx bx-check-circle text-sm text-slate-500" aria-hidden="true" />
      <span>Online</span>
    </span>
  );
}

/**
 * Renders hardware printer status chip for a kiosk terminal.
 */
function HardwarePrinterBadge({ hardware }: { hardware: KioskPresencePayload['hardware'] }) {
  if (hardware.printerReady) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 w-fit">
          <i className="bx bx-check-shield text-sm" aria-hidden="true" />
          <span>Printer Ready</span>
        </span>
        <span className="text-[11px] text-slate-600 dark:text-[#a3a3a3] font-mono break-words">
          {hardware.printerDetails}
        </span>
        {hardware.paperStatus === 'low' && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <i className="bx bx-error text-xs" aria-hidden="true" />
            <span>Paper roll running low</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 w-fit">
        <i className="bx bx-x-circle text-sm" aria-hidden="true" />
        <span>No Printer Configured</span>
      </span>
      <span className="text-[11px] text-slate-400 dark:text-[#737373] italic">
        Pair via WebUSB or configure LAN IP
      </span>
    </div>
  );
}

/**
 * SuperAdmin component tracking active kiosk touchscreen terminals and hardware telemetry.
 */
export function KioskDetectionCard() {
  const { kiosks, totalKiosks, activeCount, readyPrintersCount, loading } =
    useKioskPresenceMonitor();

  const S = CUSTOMIZATION_STYLES;
  const B = SUPERADMIN_STYLES.buttons;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-6 mb-6">
      {/* Header and Telemetry Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2e2e2e]">
        <div>
          <div className="flex items-center gap-2">
            <i className="bx bx-devices text-xl text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">
              Active Kiosk Terminals & Telemetry
            </h2>
            <span className="relative flex h-2.5 w-2.5 ml-1">
              {totalKiosks > 0 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </>
              ) : (
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-300 dark:bg-slate-700" />
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">
            Real-time detection of open touchscreen terminals, active patient screens, and receipt printer hardware status.
          </p>
        </div>

        <Link
          href="/kiosk"
          target="_blank"
          rel="noopener noreferrer"
          className={`${B.secondary} text-xs py-1.5 px-3 flex items-center gap-1.5 w-fit shrink-0`}
        >
          <i className="bx bx-external-link text-sm" aria-hidden="true" />
          <span>Launch Kiosk Terminal</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Terminals */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50/50 dark:bg-[#141414]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#a3a3a3]">
              Available Terminals
            </span>
            <i className="bx bx-desktop text-lg text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-[#f5f5f5] mt-2">
            {loading ? '-' : totalKiosks}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#737373] mt-0.5">
            {totalKiosks === 1 ? '1 terminal active' : `${totalKiosks} terminals detected`}
          </p>
        </div>

        {/* Metric 2: Actively Browsing */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50/50 dark:bg-[#141414]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#a3a3a3]">
              Active Patient Sessions
            </span>
            <i className="bx bx-user-check text-lg text-emerald-500" aria-hidden="true" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {loading ? '-' : activeCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#737373] mt-0.5">
            Patients actively touching screens
          </p>
        </div>

        {/* Metric 3: Hardware Printer Readiness */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50/50 dark:bg-[#141414]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#a3a3a3]">
              Hardware Ready
            </span>
            <i className="bx bx-printer text-lg text-rose-500" aria-hidden="true" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-[#f5f5f5] mt-2">
            {loading ? '-' : `${readyPrintersCount} / ${totalKiosks}`}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#737373] mt-0.5">
            Terminals with operational printers
          </p>
        </div>
      </div>

      {/* Kiosk Terminals List */}
      <div>
        {totalKiosks === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-[#333] bg-slate-50/40 dark:bg-[#151515]">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#222] flex items-center justify-center text-slate-400 mb-3 text-2xl">
              <i className="bx bx-desktop" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f5]">
              No Kiosk Terminals Currently Connected
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] max-w-md mx-auto mt-1 leading-relaxed">
              When patient check-in touchscreens open any /kiosk page, they will instantly register here and stream live status, screen navigation, and thermal printer hardware diagnostics.
            </p>
          </div>
        ) : (
          <div className={S.tableContainer}>
            <table className={S.table}>
              <thead className={S.thead}>
                <tr>
                  <th className={S.th}>Terminal</th>
                  <th className={S.th}>Current Screen</th>
                  <th className={S.th}>Terminal Status</th>
                  <th className={S.th}>Hardware & Printer Status</th>
                  <th className={`${S.th} text-right`}>Last Heartbeat</th>
                </tr>
              </thead>
              <tbody className={S.tbody}>
                {kiosks.map((kiosk) => (
                  <tr key={kiosk.kioskId} className={S.tr}>
                    <td className={S.td}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-base shrink-0">
                          <i className="bx bx-desktop" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-[#f5f5f5] text-xs">
                            {kiosk.kioskName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {kiosk.kioskId} &bull; {kiosk.screenResolution}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className={S.td}>
                      <div className="font-semibold text-slate-800 dark:text-[#e5e5e5] text-xs">
                        {kiosk.currentScreenTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {kiosk.currentPath}
                      </div>
                    </td>

                    <td className={S.td}>
                      <KioskStatusBadge status={kiosk.status} />
                    </td>

                    <td className={S.td}>
                      <HardwarePrinterBadge hardware={kiosk.hardware} />
                    </td>

                    <td className={`${S.td} text-right`}>
                      <span className="text-xs font-mono text-slate-600 dark:text-[#a3a3a3]">
                        {formatTime(kiosk.lastSeen)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
