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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * Handles password change request to the backend auth endpoint.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError(T.errorMinLength);
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
        <p className={S.cardDescription}>Update your account password using your current password. Other device sessions will be signed out.</p>
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
        <div className={S.fieldGroup}>
          <label htmlFor="current-password" className={S.inputLabel}>
            {T.currentPasswordLabel}
          </label>
          <input
            type="password"
            id="current-password"
            autoComplete="current-password"
            disabled={saving}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={T.currentPasswordPlaceholder}
            className={S.passwordInput}
            required
          />
        </div>

        <div className={S.fieldGrid}>
          <div className={S.fieldGroup}>
            <label htmlFor="new-password" className={S.inputLabel}>
              {T.newPasswordLabel}
            </label>
            <input
              type="password"
              id="new-password"
              autoComplete="new-password"
              minLength={8}
              disabled={saving}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={T.newPasswordPlaceholder}
              className={S.passwordInput}
              required
            />
          </div>

          <div className={S.fieldGroup}>
            <label htmlFor="confirm-password" className={S.inputLabel}>
              {T.confirmPasswordLabel}
            </label>
            <input
              type="password"
              id="confirm-password"
              autoComplete="new-password"
              minLength={8}
              disabled={saving}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={T.confirmPasswordPlaceholder}
              className={S.passwordInput}
              required
            />
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
