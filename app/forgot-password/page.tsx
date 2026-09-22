'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true); 
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-5">
      <div className="w-full max-w-md rounded-[32px] border border-white/40 bg-white/35 px-10 py-10 shadow-lg backdrop-blur-2xl">
        <h1 className="text-2xl font-bold text-black-800 mb-2 text-center">Reset your password</h1>
        <p className="text-sm text-black-500 mb-6 text-center">
          Enter your work email and we'll send you a reset link.
        </p>

        {submitted ? (
          <p className="text-sm text-gray-700 text-center">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 mb-4 text-sm text-black"
            />
            <button type="submit" disabled={loading}
              className="w-full rounded-2xl bg-[#cc3535] py-3 text-white font-semibold disabled:opacity-60">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <a href="/login" className="block text-center text-sm text-white-500 hover:text-[#cc3535] mt-6">
          Back to login
        </a>
      </div>
    </div>
  );
}