/**
 * @fileoverview Hero presentation component for the Public Landing Page.
 *
 * Showcases the platform's core clinical purpose, institution branding,
 * Staff Login action trigger, and live operational status indicators.
 *
 * @module app/landing/components/LandingHero
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LANDING_TEXTS } from '../constants/landingTexts';
import { LANDING_STYLES } from '../constants/landingStyles';

/**
 * High-impact hero section for the landing page.
 *
 * @returns JSX element.
 */
export function LandingHero() {
  const router = useRouter();
  const S = LANDING_STYLES.hero;
  const T = LANDING_TEXTS.hero;

  return (
    <section className={S.section}>
      <div className={S.container}>

        {/* Main Heading: Heart Check PHC */}
        <h1 className={S.title}>
          {T.mainTitle}{' '}
          <span className={S.accentText}>{T.mainTitleAccent}</span>
        </h1>

        {/* Subtitle / Platform Overview */}
        <p className={S.description}>{T.subheading}</p>

        {/* Call-to-Action: Staff Login Only */}
        <div className={S.ctaGroup}>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={S.primaryCta}
          >
            <i className="bx bx-log-in-circle text-lg" />
            <span>{T.primaryCta}</span>
          </button>
        </div>

        {/* Operational Telemetry Pill Bar */}
        <div className={S.telemetryBar}>
          <div className={S.telemetryItem}>
            <span className={S.telemetryStatusDot} />
            <span>{T.livePillTitle}</span>
          </div>

          <span className={S.telemetryDivider}>•</span>

          <div className={S.telemetryItem}>
            <i className={`bx bx-time-five ${S.telemetryTimeIcon}`} />
            <span>{T.operationalHours}</span>
          </div>

          <span className={S.telemetryDivider}>•</span>

          <div className={S.telemetryItem}>
            <i className={`bx bx-globe ${S.telemetryGlobeIcon}`} />
            <span>{T.livePillSubtitle} (UTC+8)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
