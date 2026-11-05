/**
 * @fileoverview Hero presentation component for the Public Landing Page.
 *
 * Showcases the platform's core clinical purpose, institution branding,
 * and live operational status indicators.
 *
 * @module app/landing/components/LandingHero
 */

'use client';

import React from 'react';
import { LANDING_TEXTS } from '@/app/landing/constants/landingTexts';
import { LANDING_STYLES } from '@/app/landing/constants/landingStyles';
import { BrandLogo } from '@/components/reusables/BrandLogo';

/**
 * High-impact hero section for the landing page.
 *
 * @returns JSX element.
 */
export function LandingHero() {
  const S = LANDING_STYLES.hero;
  const T = LANDING_TEXTS.hero;

  return (
    <section className={S.section}>
      <div className={S.container}>

        {/* Full Brand Identity Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <BrandLogo variant="full" className="h-64 sm:h-80 md:h-[26rem] lg:h-[32rem] xl:h-[36rem] w-auto max-w-full" />
        </div>

        {/* Accessible heading for screen readers and SEO */}
        <h1 className="sr-only">
          {T.mainTitle} {T.mainTitleAccent}
        </h1>

        {/* Subtitle / Platform Overview */}
        <p className={S.description}>{T.subheading}</p>

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

