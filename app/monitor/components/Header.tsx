'use client';

/**
 * @fileoverview Public TV Monitor Top Header Bar.
 *
 * Displays high-contrast departmental branding and live Manila clock for outpatient
 * waiting room displays. Adheres strictly to AGENTS.md standards:
 * - Comprehensive JSDoc documentation (Rule 1)
 * - Zero emojis (Rule 6)
 * - Clean presentation surface with zero unwanted administrative buttons on public displays
 *
 * @module app/monitor/components/Header
 */

import React from 'react';

/** Props for {@link Header}. */
type HeaderProps = {
  /** Service or clinical department title (e.g. "Consultation - Adult", "Registration"). */
  title: string;
  /** Live Manila timestamp updated on 1-second interval. */
  currentTime: Date;
};

/**
 * Renders the top brand header for public waiting room queue monitors.
 *
 * @param props - Component props containing title and current time.
 * @returns The rendered monitor header element.
 */
export function Header({ title, currentTime }: HeaderProps) {
  return (
    <div className="bg-[#cc3535] px-12 py-8 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div>
          <p className="text-white/70 text-xl uppercase tracking-widest font-medium">OUT-PATIENT DIVISION</p>
          <h1 className="text-white text-7xl font-black">{title}</h1>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white text-6xl font-bold tabular-nums">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-white/70 text-xl">
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}