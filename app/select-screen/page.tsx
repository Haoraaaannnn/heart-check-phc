/**
 * @fileoverview Screen Display Selector page (/select-screen).
 *
 * Allows authenticated hospital staff to choose the display mode or workstation
 * for their physical screen or terminal, filtering available operational modules
 * according to their role while providing access to public kiosks and monitors.
 *
 * @remarks
 * Conforms strictly to AGENTS.md enterprise navigation and solid surfaces standards:
 * high-contrast solid surfaces, crisp 1-pixel borders, unified design system across modules,
 * flawless dual-theme compatibility, and zero emojis.
 *
 * @module app/select-screen/page
 */

'use client';

import React from 'react';
import { useCurrentStaff } from './hooks/useCurrentStaff';
import { SCREEN_OPTIONS, SELECT_SCREEN_STYLES } from './constants/selectScreen';
import { SELECT_SCREEN_TEXTS } from './constants/selectScreenTexts';
import SelectScreenHeader from './components/SelectScreenHeader';
import ScreenOptionCard from './components/ScreenOptionCard';

/**
 * Screen Display Selector main page component.
 *
 * @returns JSX element.
 */
export default function SelectScreenPage() {
  const { staff, loading, error, signOut } = useCurrentStaff();
  const S = SELECT_SCREEN_STYLES;
  const T = SELECT_SCREEN_TEXTS;

  if (loading) {
    return (
      <div className={S.page}>
        <div className={S.container}>
          <div className={S.loadingWrap}>
            <div className={S.spinner} />
            <p className={S.loadingText}>
              {T.loading.verifyingAuth}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userRole = staff?.role || '';

  // Public displays are accessible to all authenticated staff setting up terminals
  const displayOptions = SCREEN_OPTIONS.filter(
    (opt) => opt.category === 'display' && opt.allowedRoles.includes(userRole)
  );

  // Operational workstations are restricted to authorized roles
  const workstationOptions = SCREEN_OPTIONS.filter(
    (opt) => opt.category === 'workstation' && opt.allowedRoles.includes(userRole)
  );

  return (
    <div className={S.page}>
      <SelectScreenHeader staff={staff} onSignOut={signOut} />

      <main className={S.container}>
        {error && (
          <div className={S.errorWrap} role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Public Terminal Displays Section */}
        <section className={S.section.container}>
          <div className={S.section.headerRow}>
            <h2 className={S.section.title}>
              <i className={`bx bx-broadcast ${S.section.titleIcon}`} />
              <span>{T.sections.displaysTitle}</span>
            </h2>
            <p className={S.section.subtitle}>{T.sections.displaysSubtitle}</p>
          </div>

          <div className={S.section.grid}>
            {displayOptions.map((opt) => (
              <ScreenOptionCard key={opt.id} option={opt} />
            ))}
          </div>
        </section>

        {/* Staff Operational Workstations Section */}
        <section className={S.section.container}>
          <div className={S.section.headerRow}>
            <h2 className={S.section.title}>
              <i className={`bx bx-briefcase-alt-2 ${S.section.titleIcon}`} />
              <span>{T.sections.workstationsTitle}</span>
            </h2>
            <p className={S.section.subtitle}>{T.sections.workstationsSubtitle}</p>
          </div>

          {workstationOptions.length === 0 ? (
            <div className={S.emptyWrap}>
              <p className={S.emptyText}>
                {T.empty.noWorkstations}
              </p>
            </div>
          ) : (
            <div className={S.section.workstationsGrid}>
              {workstationOptions.map((opt) => (
                <ScreenOptionCard key={opt.id} option={opt} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
