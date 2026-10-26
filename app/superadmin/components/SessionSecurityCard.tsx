/** @fileoverview Superadmin-only inactivity policy editor and current shared-session countdown. */
'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/app/superadmin/lib/adminApi';
import { SETTINGS_TEXTS } from '@/app/superadmin/constants/settingsTexts';
import { SETTINGS_STYLES } from '@/app/superadmin/constants/settingsStyles';
import { parseSessionMinutes, SESSION_POLICY, SESSION_POLICY_EVENT, SESSION_POLICY_STORAGE } from '@/lib/sessionPolicy';
import { SessionCountdown } from '@/components/auth/SessionCountdown';

/** @returns A validated session-duration editor; changes require Superadmin verification on the server. */
export function SessionSecurityCard() {
  const T = SETTINGS_TEXTS.sessionTimeout;
  const S = SETTINGS_STYLES;
  const [minutes, setMinutes] = useState<string>(String(SESSION_POLICY.defaultMinutes));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    void adminApi('/api/auth/session-policy').then(result => {
      if (active) setMinutes(String(result.minutes));
    }).catch(() => { if (active) setError(T.errorLoad); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [T.errorLoad]);

  /** Saves a bounded duration and notifies sibling tabs without reloading their pages. */
  const save = async () => {
    const value = parseSessionMinutes(minutes);
    setError(''); setMessage('');
    if (value === null) { setError(T.errorInvalid); return; }
    setSaving(true);
    try {
      const result = await adminApi('/api/auth/session-policy', 'POST', { minutes: value });
      setMinutes(String(result.minutes));
      try { localStorage.setItem(SESSION_POLICY_STORAGE, String(result.minutes)); } catch { /* Other devices still refresh from the server. */ }
      window.dispatchEvent(new CustomEvent(SESSION_POLICY_EVENT, { detail: result.minutes }));
      setMessage(T.success);
    } catch (err) { setError(err instanceof Error ? err.message : SETTINGS_TEXTS.feedback.genericError); }
    finally { setSaving(false); }
  };

  return (
    <section className={S.card}>
      <div className={S.cardHeader}>
        <h3 className={S.cardTitle}>{T.title}</h3>
        <p className={S.cardDescription}>{T.description}</p>
      </div>
      <SessionCountdown />
      {error && <p role="alert" className={S.alertError}>{error}</p>}
      {message && <p role="status" className={S.alertSuccess}>{message}</p>}
      <div className={S.sessionInputRow}>
        <label htmlFor="staff-session-timeout" className={S.unitLabel}>{T.label}</label>
        <input id="staff-session-timeout" type="number" min={SESSION_POLICY.minMinutes} max={SESSION_POLICY.maxMinutes} step="1"
          value={minutes} onChange={event => setMinutes(event.target.value)} disabled={loading || saving} className={S.numberInput} />
        <span className={S.unitLabel}>{T.unitLabel}</span>
        <button type="button" disabled={loading || saving} onClick={() => void save()} className={S.saveButton}>
          {saving ? T.savingButton : T.saveButton}
        </button>
      </div>
      <p className={S.cardDescription}>{T.hint}</p>
    </section>
  );
}
