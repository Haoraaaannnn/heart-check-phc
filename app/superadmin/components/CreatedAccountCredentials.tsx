/** @fileoverview Session-only credential handoff for newly provisioned accounts. */
import { useState } from 'react';
import { AccountCredentials } from '@/lib/accountCredentials';

/**
 * Shows credentials without persisting them in browser storage.
 * @param props - Credentials returned to the creating superadmin.
 * @returns A selectable credential panel with clipboard feedback.
 */
export function CreatedAccountCredentials({ credentials }: { credentials: AccountCredentials }) {
  const [copyStatus, setCopyStatus] = useState('');
  /** @returns Completion with explicit clipboard success or failure feedback. */
  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(`Login: ${credentials.email}\nPassword: ${credentials.password}`);
      setCopyStatus('Credentials copied.');
    } catch {
      setCopyStatus('Unable to copy automatically. Select and copy the credentials below.');
    }
  }
  return <section className="rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
    <h3 className="font-semibold">New account credentials</h3>
    <dl className="my-3 text-sm">
      <dt>Login</dt><dd className="select-all break-all font-mono mb-2">{credentials.email}</dd>
      <dt>Password</dt><dd className="select-all break-all font-mono">{credentials.password}</dd>
    </dl>
    <p className="text-xs text-slate-500 mb-3">Save these credentials and share them privately with the user. The password will no longer be shown after this window closes.</p>
    <button type="button" onClick={copyCredentials} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">Copy credentials</button>
    <p role="status" className="mt-2 text-xs">{copyStatus}</p>
  </section>;
}
