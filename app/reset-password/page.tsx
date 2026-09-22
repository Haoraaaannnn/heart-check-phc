'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; 

const supabase = createClient();

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Unable to reset password.'); setLoading(false); return; }

      await supabase.auth.signOut();
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (checking) return null;

  if (!hasSession) {
    return (
      <div className="flex h-screen items-center justify-center text-center px-6">
        <div>
          <p className="text-gray-700 font-semibold">This reset link is invalid or has expired.</p>
          <a href="/forgot-password" className="text-[#cc3535] underline mt-2 inline-block">Request a new link</a>
        </div>
      </div>
    );
  }

  if (done) {
    return <div className="flex h-screen items-center justify-center"><p className="text-green-600 font-semibold">Password updated. Redirecting…</p></div>;
  }

  return (
    <div className="flex h-screen items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[32px] border border-white/40 bg-white/60 p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Set a new password</h1>
        <input type="password" placeholder="New password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-gray-300 px-4 py-3 mb-3 text-sm text-black" required />
        <input type="password" placeholder="Confirm new password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-2xl border border-gray-300 px-4 py-3 mb-4 text-sm text-black" required />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-2xl bg-[#cc3535] py-3 text-white font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}