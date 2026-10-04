/**
 * @fileoverview Main orchestrator page for the Public Landing Page (/).
 *
 * Implements an enterprise clinical entry portal for the Philippine Heart Center
 * Out-Patient Department queue management platform.
 *
 * Features:
 * 1. Enterprise top navigation with Manila clock and theme switch via {@link LandingHeader}.
 * 2. High-impact clinical mission hero presentation via {@link LandingHero}.
 * 3. Subsystem and capabilities grid across clinical stations via {@link LandingFeatures}.
 * 4. End-to-end 4-stage patient journey pipeline via {@link LandingWorkflow}.
 * 5. Institutional credentials and regulatory disclaimers via {@link LandingFooter}.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: pure assembly and rendering, strict separation of concerns,
 * high-contrast solid surfaces, zero emojis, and zero truncated text.
 *
 * @module app/page
 */

'use client';

import React from 'react';
import { LANDING_STYLES } from './landing/constants/landingStyles';
import { LandingHeader } from './landing/components/LandingHeader';
import { LandingHero } from './landing/components/LandingHero';
import { LandingFeatures } from './landing/components/LandingFeatures';
import { LandingWorkflow } from './landing/components/LandingWorkflow';
import { LandingFooter } from './landing/components/LandingFooter';

/**
 * Public Landing Page root component.
 *
 * @returns Rendered JSX element.
 */
export default function LandingPage() {
  const S = LANDING_STYLES;

  return (
    <div className={S.page}>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingWorkflow />
      </main>
      <LandingFooter />
    </div>
  );
}