/**
 * @fileoverview Screen Display Selector page (/select-screen).
 *
 * Allows authenticated hospital staff to choose the display mode or workstation
 * for their physical screen or terminal, with 1-to-1 desk configuration and
 * multi-service subscriptions for Registration and Nurse stations.
 *
 * @remarks
 * Conforms strictly to AGENTS.md enterprise navigation and solid surfaces standards:
 * high-contrast solid surfaces, crisp 1-pixel borders, unified design system across modules,
 * flawless dual-theme compatibility, and zero emojis.
 *
 * @module app/select-screen/page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentStaff } from '@/app/select-screen/hooks/useCurrentStaff';
import { SCREEN_OPTIONS, SELECT_SCREEN_STYLES } from '@/app/select-screen/constants/selectScreen';
import { SELECT_SCREEN_TEXTS } from '@/app/select-screen/constants/selectScreenTexts';
import SelectScreenHeader from '@/app/select-screen/components/SelectScreenHeader';
import ScreenOptionCard from '@/app/select-screen/components/ScreenOptionCard';
import { StationSetupModal } from '@/components/reusables/StationSetupModal';
import { useStationClaim } from '@/hooks/useStationClaim';

/**
 * Screen Display Selector main page component.
 *
 * @returns JSX element.
 */
export default function SelectScreenPage() {
  const router = useRouter();
  const { staff, loading, error, signOut } = useCurrentStaff();
  const S = SELECT_SCREEN_STYLES;
  const T = SELECT_SCREEN_TEXTS;

  const {
    assignment,
    counters,
    cubicles,
    services,
    claimStation,
    removeStationClaim,
    refresh: refreshStationClaim,
  } = useStationClaim();

  const [setupWorkstation, setSetupWorkstation] = useState<'registration' | 'nurse' | null>(null);

  if (loading) {
    return (
      <div className={S.page}>
        <div className={S.container}>
          <div className={S.loadingWrap}>
            <div className={S.spinner} />
            <p className={S.loadingText}>{T.loading.verifyingAuth}</p>
          </div>
        </div>
      </div>
    );
  }

  const userRole = staff?.role || '';

  // Find assigned cubicle number
  const assignedCubicle = cubicles.find((c) => c.id === assignment.cubicleId);

  // Public displays are accessible to all authenticated staff setting up terminals
  const displayOptions = SCREEN_OPTIONS.filter(
    (opt) => opt.category === 'display' && opt.allowedRoles.includes(userRole)
  );

  // Operational workstations are restricted to authorized roles and granular permissions
  const workstationOptions = SCREEN_OPTIONS.filter((opt) => {
    if (opt.category !== 'workstation' || !opt.allowedRoles.includes(userRole)) {
      return false;
    }
    if (staff?.allowedWorkstations && Array.isArray(staff.allowedWorkstations)) {
      return staff.allowedWorkstations.includes(opt.id);
    }
    return true;
  });

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
              <p className={S.emptyText}>{T.empty.noWorkstations}</p>
            </div>
          ) : (
            <div className={S.section.workstationsGrid}>
              {workstationOptions.map((opt) => {
                if (opt.id === 'transfer') {
                  return (
                    <ScreenOptionCard
                      key={opt.id}
                      option={opt}
                      assignedCounter={assignment.counter}
                      assignedServices={assignment.services}
                      onOpenStationModal={(ws) => setSetupWorkstation(ws)}
                    />
                  );
                }

                if (opt.id === 'nurse') {
                  return (
                    <ScreenOptionCard
                      key={opt.id}
                      option={opt}
                      assignedCubicleNum={assignedCubicle?.cubicleNum ?? null}
                      assignedServices={assignment.services}
                      onOpenStationModal={(ws) => setSetupWorkstation(ws)}
                    />
                  );
                }

                return <ScreenOptionCard key={opt.id} option={opt} />;
              })}
            </div>
          )}
        </section>
      </main>

      {/* Station Configuration Modal */}
      {setupWorkstation && (
        <StationSetupModal
          isOpen={setupWorkstation !== null}
          onClose={() => setSetupWorkstation(null)}
          workstation={setupWorkstation}
          currentAssignment={assignment}
          counters={counters}
          cubicles={cubicles}
          services={services}
          onSave={async (params) => {
            const res = await claimStation(params);
            if (res.ok) {
              const targetRoute = setupWorkstation === 'registration' ? '/transfer' : '/nurse';
              void refreshStationClaim();
              router.push(targetRoute);
            }
            return res;
          }}
          onRemove={async () => {
            const res = await removeStationClaim(setupWorkstation);
            if (res.ok) {
              void refreshStationClaim();
            }
            return res;
          }}
        />
      )}
    </div>
  );
}
