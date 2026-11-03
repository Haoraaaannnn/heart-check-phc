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
import { useRouter, useSearchParams } from 'next/navigation';
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
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const passwordStrength = getPasswordStrength(newPassword);

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
        body: JSON.stringify({ force: true, currentPassword: temporaryPassword, newPassword }),
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#f5f5f5]">Change your temporary password</h1>
            <p className="text-sm text-slate-600 dark:text-[#aaa]">Your account is ready. Confirm the temporary password, then choose a personal password to continue.</p>
            <PasswordField id="first-login-temporary-password" label="Temporary password" autoComplete="current-password" value={temporaryPassword} onChange={setTemporaryPassword} visible={showTemporaryPassword} onToggle={() => setShowTemporaryPassword((visible) => !visible)} />
            <PasswordField id="first-login-new-password" label="Choose a new password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} visible={showNewPassword} onToggle={() => setShowNewPassword((visible) => !visible)} minLength={8} maxLength={64} />
            <PasswordStrengthMeter strength={passwordStrength} />
            <p className="text-xs text-slate-500">Use 8–64 characters; 12 or more is recommended. Avoid common words and personal details. Numbers and symbols are optional.</p>
            <PasswordField id="first-login-confirm-password" label="Confirm your new password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} minLength={8} maxLength={64} />
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

/** @param password - Candidate password. @returns A plain-language strength assessment. */
function getPasswordStrength(password: string): { label: string; score: number } {
  if (!password) return { label: 'Not entered', score: 0 };
  let score = password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0;
  if (password.length >= 16) score += 1;
  if (/(.)\1{3,}/.test(password)) score = Math.max(0, score - 1);
  if (/^(password|qwerty|letmein|welcome|admin)/i.test(password)) score = 0;
  if (password.length < 8) return { label: 'Too short', score: 0 };
  if (score <= 1) return { label: 'Weak', score: 1 };
  if (score === 2) return { label: 'Good', score: 2 };
  return { label: 'Strong', score: 3 };
}

/** @param props - Password field configuration. @returns A labeled field with an accessible visibility toggle. */
function PasswordField(props: {
  id: string; label: string; autoComplete: string; value: string; onChange: (value: string) => void;
  visible: boolean; onToggle: () => void; minLength?: number; maxLength?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor={props.id}>{props.label}</label>
      <div className="relative">
        <input id={props.id} type={props.visible ? 'text' : 'password'} autoComplete={props.autoComplete} minLength={props.minLength} maxLength={props.maxLength} required value={props.value} onChange={(event) => props.onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-16 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#cc3535]/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <button type="button" onClick={props.onToggle} aria-label={props.visible ? `Hide ${props.label.toLowerCase()}` : `Show ${props.label.toLowerCase()}`} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-lg text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-[#f5f5f5]" tabIndex={-1}>
          <i className={`bx ${props.visible ? 'bx-hide' : 'bx-show'}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** @param props - Current password strength. @returns A labeled strength meter. */
function PasswordStrengthMeter({ strength }: { strength: { label: string; score: number } }) {
  const tones = ['bg-slate-300', 'bg-amber-500', 'bg-lime-600', 'bg-emerald-600'];
  return (
    <div aria-live="polite" aria-label={`Password strength: ${strength.label}`} className="space-y-1">
      <div className="flex gap-1" aria-hidden="true">{[1, 2, 3].map((step) => <span key={step} className={`h-1.5 flex-1 rounded ${step <= strength.score ? tones[strength.score] : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>
      <p className="text-xs text-slate-600 dark:text-slate-300">Password strength: <span className="font-semibold">{strength.label}</span></p>
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
