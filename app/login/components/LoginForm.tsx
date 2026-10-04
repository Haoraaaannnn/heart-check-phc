/**
 * @fileoverview Authentication form component for the Staff Login page.
 *
 * Implements hospital credential inputs, password reveal toggle, brute-force
 * lockout countdown banner, error notifications, and submission triggers.
 *
 * @module app/login/components/LoginForm
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { LOGIN_TEXTS } from '../constants/loginTexts';
import { LOGIN_STYLES } from '../constants/loginStyles';

interface LoginFormProps {
  /** Current email state. */
  email: string;
  /** Setter for email state. */
  setEmail: (email: string) => void;
  /** Current password state. */
  password: string;
  /** Setter for password state. */
  setPassword: (password: string) => void;
  /** Active validation or authentication error message. */
  error: string;
  /** Remaining lockout seconds if rate-limited, null otherwise. */
  lockoutSecondsRemaining: number | null;
  /** Submission loading status. */
  loading: boolean;
  /** Whether password input is revealed in plain text. */
  showPassword: boolean;
  /** Toggles plain text password visibility. */
  onTogglePasswordVisibility: () => void;
  /** Form submission handler. */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  /** Ref to the email input element. */
  emailInputRef: React.RefObject<HTMLInputElement | null>;
  /** Ref to the password input element. */
  passwordInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Authentication form subcomponent.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  error,
  lockoutSecondsRemaining,
  loading,
  showPassword,
  onTogglePasswordVisibility,
  onSubmit,
  emailInputRef,
  passwordInputRef,
}: LoginFormProps) {
  const S = LOGIN_STYLES;
  const T = LOGIN_TEXTS;

  const isLockedOut = lockoutSecondsRemaining !== null;

  return (
    <div className={S.card.root}>
      {/* Header and Brand Badge */}
      <div className={S.card.headerWrap}>
        <div className={S.card.badge}>{T.card.badge}</div>
        <h1 className={S.card.title}>{T.card.title}</h1>
        <p className={S.card.subtitle}>{T.card.subtitle}</p>
      </div>

      {/* Lockout Warning Banner */}
      {isLockedOut && (
        <div className={S.alerts.lockoutWrap} role="alert" aria-live="polite">
          <i className={`bx bx-shield-x ${S.alerts.icon}`} />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={onSubmit} noValidate>
        {/* Email Address Input */}
        <div className={S.form.group}>
          <div className={S.form.labelRow}>
            <label htmlFor="staff-email" className={S.form.label}>
              {T.form.emailLabel}
            </label>
          </div>
          <div className={S.form.inputWrap}>
            <input
              id="staff-email"
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder={T.form.emailPlaceholder}
              disabled={loading || isLockedOut}
              className={S.form.input}
            />
          </div>
        </div>

        {/* Password Input */}
        <div className={S.form.group}>
          <div className={S.form.labelRow}>
            <label htmlFor="staff-password" className={S.form.label}>
              {T.form.passwordLabel}
            </label>
            <Link href="/forgot-password" className={S.form.forgotLink}>
              {T.form.forgotPasswordLink}
            </Link>
          </div>
          <div className={S.form.inputWrap}>
            <input
              id="staff-password"
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder={T.form.passwordPlaceholder}
              disabled={loading || isLockedOut}
              className={S.form.inputPassword}
            />
            <button
              type="button"
              onClick={onTogglePasswordVisibility}
              aria-label={showPassword ? T.form.hidePasswordAria : T.form.showPasswordAria}
              className={S.form.passwordToggleBtn}
              tabIndex={-1}
            >
              <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`} />
            </button>
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={loading || isLockedOut}
          className={S.form.submitButton}
        >
          {loading ? (
            <>
              <i className="bx bx-loader-alt animate-spin text-base" />
              <span>{T.form.submittingButton}</span>
            </>
          ) : (
            <>
              <i className="bx bx-log-in-circle text-base" />
              <span>{T.form.submitButton}</span>
            </>
          )}
        </button>
      </form>

      {/* General Error Alert */}
      {error && !isLockedOut && (
        <div className={S.alerts.errorWrap} role="alert" aria-live="polite">
          <i className={`bx bx-error-circle ${S.alerts.icon}`} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
