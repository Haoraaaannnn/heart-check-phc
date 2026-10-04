/**
 * @fileoverview Platform capabilities and subsystem grid for the Public Landing Page.
 *
 * Renders high-contrast solid surface cards mapping the core modules of the
 * Out-Patient Department queue coordination suite.
 *
 * @module app/landing/components/LandingFeatures
 */

'use client';

import React from 'react';
import { LANDING_TEXTS } from '../constants/landingTexts';
import { LANDING_STYLES } from '../constants/landingStyles';

/**
 * Grid rendering the integrated clinical subsystems.
 *
 * @returns JSX element.
 */
export function LandingFeatures() {
  const S = LANDING_STYLES.features;
  const T = LANDING_TEXTS.features;

  return (
    <section className={S.section}>
      <div className={S.headerWrap}>
        <span className={S.sectionTag}>{T.sectionTag}</span>
        <h2 className={S.sectionTitle}>{T.sectionTitle}</h2>
        <p className={S.sectionSubtitle}>{T.sectionSubtitle}</p>
      </div>

      <div className={S.grid}>
        {T.items.map((item) => (
          <div key={item.id} className={S.card}>
            <div>
              <div className={S.cardTop}>
                <div className={S.iconWrap}>
                  <i className={`bx ${item.icon}`} />
                </div>
                <span className={S.badge}>{item.badge}</span>
              </div>

              <h3 className={S.cardTitle}>{item.title}</h3>
              <p className={S.cardSubtitle}>{item.subtitle}</p>
              <p className={S.cardDescription}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
