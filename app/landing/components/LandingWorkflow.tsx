/**
 * @fileoverview Clinical workflow progression component for the Public Landing Page.
 *
 * Explains the 4-step patient queue journey from self-service check-in to discharge
 * and predictive analytics.
 *
 * @module app/landing/components/LandingWorkflow
 */

'use client';

import React from 'react';
import { LANDING_TEXTS } from '../constants/landingTexts';
import { LANDING_STYLES } from '../constants/landingStyles';

/**
 * 4-step clinical queue workflow progression component.
 *
 * @returns JSX element.
 */
export function LandingWorkflow() {
  const S = LANDING_STYLES.workflow;
  const T = LANDING_TEXTS.workflow;

  return (
    <section className={S.section}>
      <div className={S.container}>
        <div className={S.headerWrap}>
          <span className={S.sectionTag}>{T.sectionTag}</span>
          <h2 className={S.sectionTitle}>{T.sectionTitle}</h2>
          <p className={S.sectionSubtitle}>{T.sectionSubtitle}</p>
        </div>

        <div className={S.grid}>
          {T.steps.map((step) => (
            <div key={step.stepNumber} className={S.card}>
              <div className={S.stepHeader}>
                <span className={S.stepNumber}>Step {step.stepNumber}</span>
                <i className={`bx ${step.icon} ${S.stepIcon}`} />
              </div>

              <div>
                <h3 className={S.stepTitle}>{step.title}</h3>
                <p className={S.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
