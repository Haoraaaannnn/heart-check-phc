'use client';

/**
 * @fileoverview Audio context initialization gateway for Public TV Monitors.
 *
 * Browsers block automated audio playback until a user interaction gesture occurs.
 * This screen prompts hospital staff to activate the audio chime and Web Audio API
 * before displaying the live queue monitor.
 *
 * @module app/monitor/components/StartScreen
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

/** Props for {@link StartScreen}. */
type StartScreenProps = {
  /** Service category (e.g. "Consultation", "ECG"). */
  category: string;
  /** Optional service subcategory (e.g. "Adult", "Pedia"). */
  subcategory: string | null;
  /** Callback triggered upon starting the monitor display. */
  onStart: () => void;
};

/**
 * Renders the audio initialization gateway screen.
 *
 * @param props - Component props containing service titles and start handler.
 * @returns The rendered start screen element.
 */
export function StartScreen({ category, subcategory, onStart }: StartScreenProps) {
  const router = useRouter();
  const displayTitle = subcategory ? `${category} - ${subcategory}` : category;

  return (
    <div className={MONITOR_STYLES.startScreen.container}>
      <button
        type="button"
        onClick={() => router.push('/monitor')}
        className={MONITOR_STYLES.startScreen.backButton}
        title={MONITOR_TEXTS.startScreen.backButton}
        aria-label={MONITOR_TEXTS.startScreen.backButton}
      >
        <i className={MONITOR_STYLES.startScreen.backIcon} aria-hidden="true" />
        <span className={MONITOR_STYLES.startScreen.backLabel}>
          {MONITOR_TEXTS.startScreen.backButton}
        </span>
      </button>

      <div className={MONITOR_STYLES.startScreen.iconBadge}>
        <img
          src="/icons/logo-icon-white.png"
          alt="Philippine Heart Center"
          className="h-12 sm:h-16 w-auto object-contain"
        />
      </div>

      <h1 className={MONITOR_STYLES.startScreen.title}>
        {displayTitle} {MONITOR_TEXTS.startScreen.titleSuffix}
      </h1>

      <button
        type="button"
        onClick={() => {
          const audio = new Audio();
          audio.play().catch(() => {});
          onStart();
        }}
        className={MONITOR_STYLES.startScreen.startButton}
      >
        {MONITOR_TEXTS.startScreen.startButton}
      </button>
    </div>
  );
}