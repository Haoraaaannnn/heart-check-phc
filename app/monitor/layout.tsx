'use client';

/**
 * @fileoverview Root layout for public waiting room queue monitor displays (/monitor/*).
 *
 * Enforces strictly light-mode display standards for hospital waiting area monitors,
 * matching institutional clinical visibility and public signage requirements (high contrast,
 * solid white backgrounds).
 *
 * Non-destructive lifecycle effect:
 * Temporarily removes the 'dark' class from <html> while inside the monitor module and
 * restores it cleanly upon unmount without mutating next-themes state in localStorage or
 * interfering with other workstation tabs.
 *
 * @module app/monitor/layout
 */

import React, { useEffect } from 'react';

/** Props for {@link MonitorLayout}. */
interface MonitorLayoutProps {
  /** The monitor page content. */
  children: React.ReactNode;
}

/**
 * Enforces light-mode display lock across all public waiting room monitor screens.
 *
 * @param props - Component props containing child route elements.
 * @returns The rendered monitor layout shell.
 */
export default function MonitorLayout({ children }: MonitorLayoutProps) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const wasDark = root.classList.contains('dark');
    const prevHtmlOverflow = root.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      root.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      if (wasDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      }
    };
  }, []);

  return (
    <div className="h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden flex flex-col bg-white text-slate-800 font-sans select-none">
      {children}
    </div>
  );
}
