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
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useCurrentStaff } from '@/app/select-screen/hooks/useCurrentStaff';
import { SCREEN_OPTIONS, SELECT_SCREEN_STYLES } from '@/app/select-screen/constants/selectScreen';
import { SELECT_SCREEN_TEXTS } from '@/app/select-screen/constants/selectScreenTexts';
import SelectScreenHeader from '@/app/select-screen/components/SelectScreenHeader';
import ScreenOptionCard from '@/app/select-screen/components/ScreenOptionCard';
import { StationSetupModal } from '@/components/reusables/StationSetupModal';
import { useStationClaim } from '@/hooks/useStationClaim';
import { supabase } from '@/lib/supabase';

/**
 * Screen Display Selector inner content component.
 */
function SelectScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForcedPasswordChange = searchParams.get('changePassword') === 'required';
  const { staff, loading, error, signOut } = useCurrentStaff();
  const S = SELECT_SCREEN_STYLES;
  const T = SELECT_SCREEN_TEXTS;

  const {
    assignment,
    savedConfiguration,
    counters,
    cubicles,
    services,
    claimStation,
    removeStationClaim,
    refresh: refreshStationClaim,
  } = useStationClaim();

  const [setupWorkstation, setSetupWorkstation] = useState<'registration' | 'nurse' | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleForcedPasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8 || newPassword.length > 64) {
      setPasswordError('Password must be between 8 and 64 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Sign in again.');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ force: true, newPassword }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        setPasswordError(typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string' ? result.error : 'Unable to change password. Please try again.');
        return;
      }
      router.replace('/select-screen');
      router.refresh();
    } catch {
      setPasswordError('Unable to change password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

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

  if (isForcedPasswordChange) {
    return (
      <div className={S.page}>
        <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-5 py-10">
          <form onSubmit={handleForcedPasswordChange} className="w-full space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#f5f5f5]">Set your personal password</h1>
            <p className="text-sm text-slate-600 dark:text-[#aaa]">Change your temporary password to continue. Use 8–64 characters; 12 or more is recommended. Avoid common words and personal details. Character variety is optional.</p>
            <label className="block space-y-1 text-sm font-medium" htmlFor="first-login-new-password">New password</label>
            <input id="first-login-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={64} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            <label className="block space-y-1 text-sm font-medium" htmlFor="first-login-confirm-password">Confirm new password</label>
            <input id="first-login-confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={64} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            {passwordError && <p role="alert" className="text-sm text-red-700">{passwordError}</p>}
            <button type="submit" disabled={passwordSaving} className="w-full rounded-md bg-[#cc3535] px-4 py-2 font-semibold text-white disabled:opacity-60">{passwordSaving ? 'Updating…' : 'Update password and continue'}</button>
          </form>
        </main>
      </div>
    );
  }

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
          savedConfiguration={savedConfiguration}
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

/**
 * Screen Display Selector main page component.
 * Wrapped in Suspense boundary to support Next.js static prerendering with useSearchParams.
 *
 * @returns JSX element.
 */
export default function SelectScreenPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <SelectScreenContent />
    </React.Suspense>
  );
}
