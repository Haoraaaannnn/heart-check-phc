'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ConfirmRecoveryPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  const handleConfirm = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/verify-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_hash: tokenHash, type }),
    });
    if (res.ok) {
      router.push('/reset-password');
    } else {
      setError('This link is invalid or has expired. Please request a new one.');
      setLoading(false);
    }
  };

  if (!tokenHash || type !== 'recovery') {
    return <p className="text-center mt-20 text-gray-600">Invalid reset link.</p>;
  }

  return (
    <div className="flex h-screen items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Confirm password reset</h1>
        <p className="text-sm text-gray-500 mb-6">Click below to continue resetting your password.</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleConfirm} disabled={loading}
          className="px-6 py-3 rounded-2xl bg-[#cc3535] text-white font-semibold disabled:opacity-60">
          {loading ? 'Confirming…' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}