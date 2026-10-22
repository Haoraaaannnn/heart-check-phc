'use client';
import React from 'react';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

/**
 * Public TV Monitor Bottom Footer Bar.
 *
 * Renders bilingual waiting instructions in a fixed-height, in-flow bottom bar
 * that never overlaps main content and never triggers scrollbars.
 *
 * @returns The rendered monitor footer element.
 */
export function Footer() {
  return (
    <footer className={MONITOR_STYLES.footer.container}>
      <p className={MONITOR_STYLES.footer.instruction}>
        {MONITOR_TEXTS.footer.instructionEn}
      </p>
      <p className={MONITOR_STYLES.footer.instruction}>
        {MONITOR_TEXTS.footer.instructionFil}
      </p>
    </footer>
  );
}