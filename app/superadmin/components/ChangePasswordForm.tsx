/**
 * @fileoverview Standalone Change Password form component for SuperAdmin.
 *
 * Provides credential update capabilities with dark/light mode surface adaptation,
 * current password verification, and validation alerts.
 *
 * @module app/superadmin/components/ChangePasswordForm
 */

'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Superadmin password modification form.
 *
 * @returns JSX element containing the password change form.
 */
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('New passwords do not match.');

    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
        setError(data.error || 'Unable to change password.');
        return;
      }
      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] rounded-xl shadow-xs p-6 max-w-md">
      <h2 className="text-lg font-bold text-slate-900 dark:text-[#f5f5f5] mb-1 flex items-center gap-2">
        <i className="bx bx-lock-alt text-[#a8071a] dark:text-[#f87171]" aria-hidden="true" />
        <span>Change Password</span>
      </h2>
      <p className="text-slate-500 dark:text-[#a3a3a3] text-xs mb-4">
        You will need your current password. Other devices will be signed out.
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
          <i className="bx bx-error-circle text-base shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <i className="bx bx-check-circle text-base shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] rounded-lg text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20"
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] rounded-lg text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20"
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] rounded-lg text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 bg-[#a8071a] hover:bg-[#8e0616] text-white rounded-lg font-medium text-xs transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>
      </form>
    </div>
  );
}