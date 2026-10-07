/**
 * @fileoverview Main settings panel component for SuperAdmin.
 *
 * Configures hospital-wide automation policies including auto-rotation timeout,
 * maximum patient rotations before idle, failed login attempt thresholds,
 * lockout cooldowns, and superadmin password security.
 *
 * @module app/superadmin/components/SettingsPanel
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChangePasswordCard } from './ChangePasswordCard';
import { SETTINGS_TEXTS } from '../constants/settingsTexts';
import { SETTINGS_STYLES } from '../constants/settingsStyles';
import { SUPERADMIN_SKELETON_STYLES } from '../constants/superadminSkeletonStyles';

interface SettingsPanelProps {
  /** When true, automatically scrolls to the administrator security credentials card. */
  focusSecurity?: boolean;
}

/**
 * Superadmin system settings and security panel.
 *
 * @param props - Component options including security focus flag.
 * @returns JSX element containing the settings view.
 */
export function SettingsPanel({ focusSecurity = false }: SettingsPanelProps = {}) {
  const S = SETTINGS_STYLES;
  const T = SETTINGS_TEXTS;

  useEffect(() => {
    if (focusSecurity) {
      const timer = setTimeout(() => {
        const el = document.getElementById('security-settings-section');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [focusSecurity]);

  // 1. Auto-Rotation Timeout
  const [minutes, setMinutes] = useState<string>('3');
  const [timeoutLoading, setTimeoutLoading] = useState(true);
  const [timeoutSaving, setTimeoutSaving] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState('');
  const [timeoutError, setTimeoutError] = useState('');

  // 2. Max Rotations Before Idle
  const [maxRotations, setMaxRotations] = useState<string>('5');
  const [rotationsLoading, setRotationsLoading] = useState(true);
  const [rotationsSaving, setRotationsSaving] = useState(false);
  const [rotationsMessage, setRotationsMessage] = useState('');
  const [rotationsError, setRotationsError] = useState('');

  // 3. Max Login Attempts
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<string>('3');
  const [loginAttemptsLoading, setLoginAttemptsLoading] = useState(true);
  const [loginAttemptsSaving, setLoginAttemptsSaving] = useState(false);
  const [loginAttemptsMessage, setLoginAttemptsMessage] = useState('');
  const [loginAttemptsError, setLoginAttemptsError] = useState('');

  // 4. Lockout Duration
  const [lockoutSeconds, setLockoutSeconds] = useState<string>('30');
  const [lockoutLoading, setLockoutLoading] = useState(true);
  const [lockoutSaving, setLockoutSaving] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [lockoutError, setLockoutError] = useState('');

  /**
   * Fetches all configuration settings from app_settings table.
   */
  const loadAllSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        for (const item of data) {
          switch (item.key) {
            case 'rotate_timeout_seconds':
              setMinutes((parseInt(item.value, 10) / 60).toString());
              break;
            case 'max_rotations_before_idle':
              setMaxRotations(item.value);
              break;
            case 'max_login_attempts':
              setMaxLoginAttempts(item.value);
              break;
            case 'login_lockout_seconds':
              setLockoutSeconds(item.value);
              break;
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    } finally {
      setTimeoutLoading(false);
      setRotationsLoading(false);
      setLoginAttemptsLoading(false);
      setLockoutLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  /**
   * Saves the auto-rotation timeout value.
   */
  const handleSaveTimeout = async () => {
    setTimeoutError('');
    setTimeoutMessage('');

    const mins = parseFloat(minutes);
    if (isNaN(mins) || mins <= 0) {
      setTimeoutError(T.rotateTimeout.errorInvalid);
      return;
    }

    setTimeoutSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'rotate_timeout_seconds',
          value: Math.round(mins * 60).toString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) throw error;
      setTimeoutMessage(T.rotateTimeout.success);
      setTimeout(() => setTimeoutMessage(''), 2500);
    } catch (err: any) {
      setTimeoutError(err.message || T.feedback.genericError);
    } finally {
      setTimeoutSaving(false);
    }
  };

  /**
   * Saves the maximum rotations before idle value.
   */
  const handleSaveMaxRotations = async () => {
    setRotationsError('');
    setRotationsMessage('');

    const count = parseInt(maxRotations, 10);
    if (isNaN(count) || count <= 0) {
      setRotationsError(T.maxRotations.errorInvalid);
      return;
    }

    setRotationsSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'max_rotations_before_idle',
          value: count.toString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) throw error;
      setRotationsMessage(T.maxRotations.success);
      setTimeout(() => setRotationsMessage(''), 2500);
    } catch (err: any) {
      setRotationsError(err.message || T.feedback.genericError);
    } finally {
      setRotationsSaving(false);
    }
  };

  /**
   * Saves the maximum failed login attempts threshold.
   */
  const handleSaveMaxLoginAttempts = async () => {
    setLoginAttemptsError('');
    setLoginAttemptsMessage('');

    const count = parseInt(maxLoginAttempts, 10);
    if (isNaN(count) || count <= 0) {
      setLoginAttemptsError(T.maxLoginAttempts.errorInvalid);
      return;
    }

    setLoginAttemptsSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'max_login_attempts',
          value: count.toString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) throw error;
      setLoginAttemptsMessage(T.maxLoginAttempts.success);
      setTimeout(() => setLoginAttemptsMessage(''), 2500);
    } catch (err: any) {
      setLoginAttemptsError(err.message || T.feedback.genericError);
    } finally {
      setLoginAttemptsSaving(false);
    }
  };

  /**
   * Saves the account lockout duration.
   */
  const handleSaveLockoutSeconds = async () => {
    setLockoutError('');
    setLockoutMessage('');

    const seconds = parseInt(lockoutSeconds, 10);
    if (isNaN(seconds) || seconds <= 0) {
      setLockoutError(T.lockoutDuration.errorInvalid);
      return;
    }

    setLockoutSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'login_lockout_seconds',
          value: seconds.toString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) throw error;
      setLockoutMessage(T.lockoutDuration.success);
      setTimeout(() => setLockoutMessage(''), 2500);
    } catch (err: any) {
      setLockoutError(err.message || T.feedback.genericError);
    } finally {
      setLockoutSaving(false);
    }
  };

  return (
    <div className={S.container}>
      <div className={S.sectionHeader}>
        <h2 className={S.sectionTitle}>
          <i className="bx bx-cog text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <span>{T.sectionTitle}</span>
        </h2>
        <p className={S.sectionSubtitle}>{T.sectionSubtitle}</p>
      </div>

      <div className={S.grid}>
        {/* 1. Auto-Rotation Timeout */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <h3 className={S.cardTitle}>
              <i className={`bx bx-timer ${S.cardIcon}`} aria-hidden="true" />
              <span>{T.rotateTimeout.title}</span>
            </h3>
            <p className={S.cardDescription}>{T.rotateTimeout.description}</p>
          </div>

          <div>
            {timeoutError && <div className={`${S.alertError} mb-3`}>{timeoutError}</div>}
            {timeoutMessage && <div className={`${S.alertSuccess} mb-3`}>{timeoutMessage}</div>}

            {timeoutLoading ? (
              <div className={SUPERADMIN_SKELETON_STYLES.settings.inputRow}>
                <div className={SUPERADMIN_SKELETON_STYLES.settings.inputBox} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.unitLabel} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.saveButton} />
              </div>
            ) : (
              <div className={S.inputRow}>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className={S.numberInput}
                />
                <span className={S.unitLabel}>{T.rotateTimeout.unitLabel}</span>
                <button
                  type="button"
                  onClick={handleSaveTimeout}
                  disabled={timeoutSaving}
                  className={S.saveButton}
                >
                  {timeoutSaving ? T.rotateTimeout.savingButton : T.rotateTimeout.saveButton}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Rotations Before Idle */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <h3 className={S.cardTitle}>
              <i className={`bx bx-refresh ${S.cardIcon}`} aria-hidden="true" />
              <span>{T.maxRotations.title}</span>
            </h3>
            <p className={S.cardDescription}>{T.maxRotations.description}</p>
          </div>

          <div>
            {rotationsError && <div className={`${S.alertError} mb-3`}>{rotationsError}</div>}
            {rotationsMessage && <div className={`${S.alertSuccess} mb-3`}>{rotationsMessage}</div>}

            {rotationsLoading ? (
              <div className={SUPERADMIN_SKELETON_STYLES.settings.inputRow}>
                <div className={SUPERADMIN_SKELETON_STYLES.settings.inputBox} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.unitLabel} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.saveButton} />
              </div>
            ) : (
              <div className={S.inputRow}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxRotations}
                  onChange={(e) => setMaxRotations(e.target.value)}
                  className={S.numberInput}
                />
                <span className={S.unitLabel}>{T.maxRotations.unitLabel}</span>
                <button
                  type="button"
                  onClick={handleSaveMaxRotations}
                  disabled={rotationsSaving}
                  className={S.saveButton}
                >
                  {rotationsSaving ? T.maxRotations.savingButton : T.maxRotations.saveButton}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Max Login Attempts */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <h3 className={S.cardTitle}>
              <i className={`bx bx-shield-alt-2 ${S.cardIcon}`} aria-hidden="true" />
              <span>{T.maxLoginAttempts.title}</span>
            </h3>
            <p className={S.cardDescription}>{T.maxLoginAttempts.description}</p>
          </div>

          <div>
            {loginAttemptsError && <div className={`${S.alertError} mb-3`}>{loginAttemptsError}</div>}
            {loginAttemptsMessage && <div className={`${S.alertSuccess} mb-3`}>{loginAttemptsMessage}</div>}

            {loginAttemptsLoading ? (
              <div className={SUPERADMIN_SKELETON_STYLES.settings.inputRow}>
                <div className={SUPERADMIN_SKELETON_STYLES.settings.inputBox} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.unitLabel} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.saveButton} />
              </div>
            ) : (
              <div className={S.inputRow}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  className={S.numberInput}
                />
                <span className={S.unitLabel}>{T.maxLoginAttempts.unitLabel}</span>
                <button
                  type="button"
                  onClick={handleSaveMaxLoginAttempts}
                  disabled={loginAttemptsSaving}
                  className={S.saveButton}
                >
                  {loginAttemptsSaving ? T.maxLoginAttempts.savingButton : T.maxLoginAttempts.saveButton}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Login Lockout Duration */}
        <div className={S.card}>
          <div className={S.cardHeader}>
            <h3 className={S.cardTitle}>
              <i className={`bx bx-time-five ${S.cardIcon}`} aria-hidden="true" />
              <span>{T.lockoutDuration.title}</span>
            </h3>
            <p className={S.cardDescription}>{T.lockoutDuration.description}</p>
          </div>

          <div>
            {lockoutError && <div className={`${S.alertError} mb-3`}>{lockoutError}</div>}
            {lockoutMessage && <div className={`${S.alertSuccess} mb-3`}>{lockoutMessage}</div>}

            {lockoutLoading ? (
              <div className={SUPERADMIN_SKELETON_STYLES.settings.inputRow}>
                <div className={SUPERADMIN_SKELETON_STYLES.settings.inputBox} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.unitLabel} />
                <div className={SUPERADMIN_SKELETON_STYLES.settings.saveButton} />
              </div>
            ) : (
              <div className={S.inputRow}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={lockoutSeconds}
                  onChange={(e) => setLockoutSeconds(e.target.value)}
                  className={S.numberInput}
                />
                <span className={S.unitLabel}>{T.lockoutDuration.unitLabel}</span>
                <button
                  type="button"
                  onClick={handleSaveLockoutSeconds}
                  disabled={lockoutSaving}
                  className={S.saveButton}
                >
                  {lockoutSaving ? T.lockoutDuration.savingButton : T.lockoutDuration.saveButton}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. Change Password Card (Integrated Security Form) */}
        <ChangePasswordCard />
      </div>
    </div>
  );
}
