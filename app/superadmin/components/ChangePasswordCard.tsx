/**
 * @fileoverview Shared card allowing authenticated staff to securely update their own password.
 *
 * Implements client-side confirmation checks, minimum length validation, current password
 * authentication, and session invalidation warnings.
 *
 * @module app/superadmin/components/ChangePasswordCard
 */

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SETTINGS_TEXTS } from '@/app/superadmin/constants/settingsTexts';
import { SETTINGS_STYLES } from '@/app/superadmin/constants/settingsStyles';

/**
 * Personal password modification card for all authenticated staff roles.
 *
 * @param props - Optional saving callback for a containing dialog.
 * @returns JSX element containing the password update form.
 */
export const ChangePasswordCard: React.FC<{ onSavingChange?: (saving: boolean) => void }> = ({ onSavingChange }) => {
  const S = SETTINGS_STYLES;
  const T = SETTINGS_TEXTS.changePassword;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const passwordStrength = getPasswordStrength(newPassword);

  /**
   * Handles password change request to the backend auth endpoint.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setMessage('');

    if (newPassword.length < 8 || newPassword.length > 64) {
      setError('New password must be between 8 and 64 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a password different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(T.errorMismatch);
      return;
    }

    setSaving(true);
    onSavingChange?.(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Sign in again.');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data: unknown = await response.json();
      if (!response.ok) {
        setError(typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string' ? data.error : T.errorGeneral);
        return;
      }

      setMessage(typeof data === 'object' && data !== null && 'warning' in data && typeof data.warning === 'string' ? data.warning : 'Your password was updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError(T.errorGeneral);
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  };

  return (
    <div id="security-settings-section" className={S.fullWidthCard}>
      <div className={S.cardHeader}>
        <h3 className={S.cardTitle}>
          <i className={`bx bx-lock-alt ${S.cardIcon}`} aria-hidden="true" />
          <span>Change Password</span>
        </h3>
        <p className={S.cardDescription}>Enter your current password, then choose and confirm a new one. Other device sessions will be signed out after the update.</p>
      </div>

      {error && (
        <div role="alert" className={S.alertError}>
          <i className="bx bx-error-circle text-base shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className={S.alertSuccess}>
          <i className="bx bx-check-circle text-base shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={S.passwordForm}>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-[#1f1f1f] dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Password requirements:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-600 dark:text-slate-400">
            <li>Between 8 and 64 characters (12 or more recommended)</li>
            <li>Letters, numbers, and symbols can be used in any combination</li>
            <li>Longer passwords are recommended; 12 or more characters is a good target</li>
            <li>Must be different from your current password</li>
            <li>Avoid common words, names, personal details, or repeated characters</li>
          </ul>
        </div>

        <div className={S.fieldGrid}>
        <div className={S.fieldGroup}>
          <label htmlFor="current-password" className={S.inputLabel}>
            {T.currentPasswordLabel}
          </label>
          <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            id="current-password"
            autoComplete="current-password"
            disabled={saving}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={T.currentPasswordPlaceholder}
            className={`${S.passwordInput} pr-16`}
            required
          />
          <PasswordVisibilityButton visible={showCurrentPassword} onToggle={() => setShowCurrentPassword((visible) => !visible)} label="current password" />
          </div>
        </div>

          <div className={S.fieldGroup}>
            <label htmlFor="new-password" className={S.inputLabel}>
              {T.newPasswordLabel}
            </label>
            <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="new-password"
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              disabled={saving}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={T.newPasswordPlaceholder}
              className={`${S.passwordInput} pr-16`}
              required
            />
            <PasswordVisibilityButton visible={showNewPassword} onToggle={() => setShowNewPassword((visible) => !visible)} label="new password" />
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">{[1, 2, 3].map((step) => <span key={step} className={`h-1.5 flex-1 rounded ${step <= passwordStrength.score ? passwordStrength.tone : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>
            <p className="text-xs text-slate-600 dark:text-slate-300">Password strength: <span className="font-semibold">{passwordStrength.label}</span></p>
          </div>

          <div className={S.fieldGroup}>
            <label htmlFor="confirm-password" className={S.inputLabel}>
              {T.confirmPasswordLabel}
            </label>
            <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              disabled={saving}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={T.confirmPasswordPlaceholder}
              className={`${S.passwordInput} pr-16`}
              required
            />
            <PasswordVisibilityButton visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} label="confirmation password" />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={S.submitButton}
        >
          {saving ? (
            <>
              <div className={S.buttonSpinner} />
              <span>{T.savingButton}</span>
            </>
          ) : (
            <span>{T.saveButton}</span>
          )}
        </button>
      </form>
    </div>
  );
};

/** @param password - Candidate password. @returns A length-focused strength indicator. */
function getPasswordStrength(password: string): { label: string; score: number; tone: string } {
  if (!password) return { label: 'Not entered', score: 0, tone: 'bg-slate-300' };
  if (password.length < 8) return { label: 'Too short', score: 0, tone: 'bg-slate-300' };
  if (/^(password|qwerty|letmein|welcome|admin)/i.test(password) || /(.)\1{3,}/.test(password)) {
    return { label: 'Weak', score: 1, tone: 'bg-amber-500' };
  }
  if (password.length < 12) return { label: 'Weak', score: 1, tone: 'bg-amber-500' };
  if (password.length < 16) return { label: 'Good', score: 2, tone: 'bg-lime-600' };
  return { label: 'Strong', score: 3, tone: 'bg-emerald-600' };
}

/** @param props - Visibility button state. @returns A keyboard-accessible show/hide control. */
function PasswordVisibilityButton({ visible, onToggle, label }: { visible: boolean; onToggle: () => void; label: string }) {
  return <button type="button" onClick={onToggle} aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-lg text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-[#f5f5f5]" tabIndex={-1}><i className={`bx ${visible ? 'bx-hide' : 'bx-show'}`} aria-hidden="true" /></button>;
}
