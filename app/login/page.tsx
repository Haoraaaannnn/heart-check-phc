/**
 * @fileoverview Staff Authentication Orchestrator page (/login).
 *
 * Implements clinical workstation sign-in for Philippine Heart Center staff,
 * featuring rate-limiting protection, brute-force lockout countdowns,
 * session establishment, and automatic workstation routing to /select-screen.
 *
 * Subcomponents:
 * 1. Top navigation with Manila clock and theme switch via {@link LoginHeader}.
 * 2. High-contrast solid credential card and form controls via {@link LoginForm}.
 * 3. Clinical IT regulatory disclaimers via {@link LoginFooter}.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: pure assembly and rendering, strict separation of concerns,
 * high-contrast solid surfaces, zero emojis, and zero truncated text.
 *
 * @module app/login/page
 */

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LOGIN_STYLES } from './constants/loginStyles';
import { LOGIN_TEXTS } from './constants/loginTexts';
import { LoginHeader } from './components/LoginHeader';
import { LoginForm } from './components/LoginForm';
import { LoginFooter } from './components/LoginFooter';

/**
 * Root login page component wrapped with Suspense boundary.
 *
 * @returns JSX element.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

/**
 * Internal login page orchestrator managing form state, security lockouts,
 * and session handshakes.
 *
 * @returns JSX element.
 */
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const S = LOGIN_STYLES;
  const T = LOGIN_TEXTS;

  /**
   * Automatically redirects to select-screen if user is already authenticated,
   * preventing unnecessary re-login or back-navigation loops into login form.
   */
  useEffect(() => {
    let active = true;
    const checkActiveSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        window.location.replace('/select-screen');
      }
    };
    void checkActiveSession();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void checkActiveSession();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      active = false;
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  /**
   * Captures idle session expiration notices from route query parameters.
   */
  useEffect(() => {
    if (searchParams.get('reason') === 'idle') {
      setError(T.alerts.idleLogout);
    }
  }, [searchParams, T.alerts.idleLogout]);

  /**
   * Automatically clears temporary error messages after 5 seconds (excluding lockouts).
   */
  useEffect(() => {
    if (!error || lockoutSecondsRemaining !== null) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error, lockoutSecondsRemaining]);

  /**
   * Counts down the rate-limit security lockout window.
   */
  useEffect(() => {
    if (lockoutSecondsRemaining === null) return;
    if (lockoutSecondsRemaining <= 0) {
      setLockoutSecondsRemaining(null);
      setError('');
      return;
    }
    const interval = setInterval(() => {
      setLockoutSecondsRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSecondsRemaining]);

  /**
   * Updates formatted lockout message string as seconds decrease.
   */
  useEffect(() => {
    if (lockoutSecondsRemaining === null) return;
    const mins = Math.floor(lockoutSecondsRemaining / 60);
    const secs = lockoutSecondsRemaining % 60;
    setError(T.alerts.lockoutTemplate(mins, secs));
  }, [lockoutSecondsRemaining, T.alerts]);

  /**
   * Submits credentials to the server-side authentication endpoint.
   *
   * @param e - React form submission event.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lockoutSecondsRemaining !== null) return;
    setError('');
    setLoading(true);

    const emailValue = email.trim();
    const passwordValue = password;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      const data = await response.json();

      setPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.value = '';
      }

      if (!response.ok) {
        if (response.status === 429) {
          setLockoutSecondsRemaining(data.secondsRemaining);
        } else {
          setLockoutSecondsRemaining(null);
          setError(data.error || T.alerts.invalidCredentials);
        }
        setLoading(false);
        return;
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (setSessionError) {
        setError(T.alerts.sessionEstablishmentFailed);
        setLoading(false);
        return;
      }

      const { data: roleData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .ilike('email', emailValue)
        .single();

      setLoading(false);

      if (dbError || !roleData) {
        setError(T.alerts.userRoleNotFound);
        return;
      }

      setEmail('');
      window.location.replace('/select-screen');
    } catch (err) {
      setPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.value = '';
      }
      setLoading(false);
      setError(T.alerts.genericError);
      console.error('Login error:', err);
    }
  };

  /**
   * Toggles visibility of the password input while retaining keyboard focus.
   */
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 0);
  };

  return (
    <div className={S.page}>
      <LoginHeader />
      <main className={S.main}>
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          error={error}
          lockoutSecondsRemaining={lockoutSecondsRemaining}
          loading={loading}
          showPassword={showPassword}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={handleSubmit}
          emailInputRef={emailInputRef}
          passwordInputRef={passwordInputRef}
        />
      </main>
      <LoginFooter />
    </div>
  );
}