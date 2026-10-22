'use client';
import { ReactNode } from 'react';

/** Fixed-viewport frame: header + content + footer always fit, never scroll. */
export function MonitorShell({ header, footer, children }: {
  header: ReactNode; footer: ReactNode; children: ReactNode;
}) {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-white dark:bg-[#0d0d0d] text-slate-800 dark:text-[#f5f5f5] font-sans">
      <div className="shrink-0">{header}</div>
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      <div className="shrink-0">{footer}</div>
    </div>
  );
}