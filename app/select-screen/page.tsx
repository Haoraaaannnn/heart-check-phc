/**
 * @fileoverview Screen Display Selector page (/select-screen).
 *
 * Allows authenticated hospital staff to choose the display mode or workstation
 * for their physical screen or terminal, filtering available operational modules
 * according to their role while providing access to public kiosks and monitors.
 *
 * @module app/select-screen/page
 */

'use client';

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
        <div className={S.blurBlobs.blob1} />
        <div className={S.blurBlobs.blob2} />
        <div className={S.container}>
          <div className={S.loadingWrap}>
            <div className={S.spinner} />
            <p className="mt-4 text-sm font-medium text-gray-500">
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
      <div className={S.blurBlobs.blob1} />
      <div className={S.blurBlobs.blob2} />
      <div className={S.blurBlobs.blob3} />

      <main className={S.container}>
        <SelectScreenHeader staff={staff} onSignOut={signOut} />

        {error && (
          <div className={S.errorWrap} role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Public Terminal Displays */}
        <section className={S.section.container}>
          <div className={S.section.headerRow}>
            <h2 className={S.section.title}>
              <i className="bx bx-broadcast text-[#cc3535]" />
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

        {/* Staff Operational Workstations */}
        <section className={S.section.container}>
          <div className={S.section.headerRow}>
            <h2 className={S.section.title}>
              <i className="bx bx-briefcase-alt-2 text-[#cc3535]" />
              <span>{T.sections.workstationsTitle}</span>
            </h2>
            <p className={S.section.subtitle}>{T.sections.workstationsSubtitle}</p>
          </div>

          {workstationOptions.length === 0 ? (
            <div className="rounded-3xl border border-white/70 bg-white/40 p-8 text-center backdrop-blur-xl">
              <p className="text-sm text-gray-500">{T.empty.noWorkstations}</p>
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
