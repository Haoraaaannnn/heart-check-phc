/**
 * @fileoverview Card component allowing superadmin to securely update their account password.
 *
 * Implements client-side confirmation checks, minimum length validation, current password
 * authentication, and session invalidation warnings.
 *
 * @module app/superadmin/components/ChangePasswordCard
 */

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SETTINGS_TEXTS } from '../constants/settingsTexts';
import { SETTINGS_STYLES } from '../constants/settingsStyles';

/**
 * Superadmin password modification card.
 *
 * @returns JSX element containing the password update form.
 */
export const ChangePasswordCard: React.FC = () => {
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || T.errorGeneral);
        return;
      }

      setMessage(T.success);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError(T.errorGeneral);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="security-settings-section" className={S.fullWidthCard}>
      <div className={S.cardHeader}>
        <h3 className={S.cardTitle}>
          <i className={`bx bx-lock-alt ${S.cardIcon}`} aria-hidden="true" />
          <span>{T.title}</span>
        </h3>
        <p className={S.cardDescription}>{T.description}</p>
      </div>

      {error && (
        <div className={S.alertError}>
          <i className="bx bx-error-circle text-base shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className={S.alertSuccess}>
          <i className="bx bx-check-circle text-base shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={S.passwordForm}>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {T.currentPasswordLabel}
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={T.currentPasswordPlaceholder}
            className={S.passwordInput}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {T.newPasswordLabel}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={T.newPasswordPlaceholder}
              className={S.passwordInput}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {T.confirmPasswordLabel}
            </label>
            <input
              type="password"
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
          className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
