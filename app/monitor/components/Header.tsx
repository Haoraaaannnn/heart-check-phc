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
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

/** Props for {@link Header}. */
type HeaderProps = {
  /** Service or clinical department title (e.g. "Consultation - Adult", "Registration"). */
  title: string;
  /** Live Manila timestamp updated on 1-second interval. */
  currentTime: Date;
};

/**
 * Renders the top brand header for public waiting room queue monitors.
 * Dynamically scales typography and padding based on screen size to prevent
 * layout clipping and eliminate scrollbars.
 *
 * @param props - Component props containing title and current time.
 * @returns The rendered monitor header element.
 */
export function Header({ title, currentTime }: HeaderProps) {
  return (
    <header className={MONITOR_STYLES.header.container}>
      <div className={MONITOR_STYLES.header.brandWrap}>
        <div>
          <p className={MONITOR_STYLES.header.subTitle}>
            {MONITOR_TEXTS.header.divisionSubTitle}
          </p>
          <h1 className={MONITOR_STYLES.header.title}>
            {title}
          </h1>
        </div>
      </div>
      <div className={MONITOR_STYLES.header.clockWrap}>
        <p className={MONITOR_STYLES.header.clockTime}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className={MONITOR_STYLES.header.clockDate}>
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </header>
  );
}