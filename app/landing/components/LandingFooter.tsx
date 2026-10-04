/**
 * @fileoverview Footer and regulatory compliance component for the Public Landing Page.
 *
 * Renders the institutional credentials of the Philippine Heart Center, version indicator,
 * legal disclaimers under RA 10173, and staff login navigation.
 *
 * @module app/landing/components/LandingFooter
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { LANDING_TEXTS } from '../constants/landingTexts';
import { LANDING_STYLES } from '../constants/landingStyles';

/**
 * Enterprise footer component for the landing page.
 *
 * @returns JSX element.
 */
export function LandingFooter() {
  const S = LANDING_STYLES.footer;
  const T = LANDING_TEXTS.footer;

  return (
    <footer className={S.root}>
      <div className={S.container}>
        {/* Top Row: Institution Identity & Quick Navigation Links */}
        <div className={S.topRow}>
          <div className={S.brandGroup}>
            <div className={S.brandBadge}>PHC</div>
            <div>
              <div className={S.brandTitle}>{T.brandName}</div>
              <div className={S.brandSubtitle}>{T.institutionFull}</div>
            </div>
          </div>

          <div className={S.linksGroup}>
            <Link href="/login" className={S.footerLink}>
              {T.loginLink}
            </Link>
          </div>
        </div>

        {/* Bottom Row: Regulatory Disclaimer & Version Pill */}
        <div className={S.bottomRow}>
          <p className={S.disclaimer}>{T.disclaimer}</p>
          <div className={S.versionPill}>{T.versionBadge}</div>
        </div>
      </div>
    </footer>
  );
}
