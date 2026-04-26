'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Invalid email or password');
      setPassword('');
      setLoading(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('email', email.trim())
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError('User role not found');
      return;
    }

    switch (data.role) {
      case 'admin':
        router.push('/dashboard');
        break;
      case 'registration':
        router.push('/transfer');
        break;
      case 'nurse':
        router.push('/nurse');
        break;
      default:
        router.push('/transfer');
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#fffdfd] via-[#fff5f5] to-[#ffeaea] px-5 font-sans">

      {/* Background Glow Effects */}
      <div className="pointer-events-none absolute inset-0 z-0">

        <div className="absolute top-[-100px] right-[-100px] h-[450px] w-[450px] rounded-full bg-[#ff6b6b]/20 blur-[130px]" />

        <div className="absolute bottom-[-120px] left-[-80px] h-[400px] w-[400px] rounded-full bg-[#ff8a8a]/20 blur-[130px]" />

        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd4d4]/30 blur-[160px]" />
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed left-8 top-8 z-20 flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 px-4 py-2 text-gray-600 backdrop-blur-xl transition hover:bg-white/60 hover:text-[#cc3535]"
      >
        <i className="bx bx-arrow-back text-xl"></i>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* Login Glass Card */}
      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/40 bg-white/35 px-10 pb-8 pt-10 shadow-[0_10px_50px_rgba(255,120,120,0.10)] backdrop-blur-2xl">

        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Staff Login
        </h1>

        <p className="mb-8 text-center text-sm text-gray-500">
          Enter your credentials to access your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-black backdrop-blur-xl transition-all duration-300 focus:border-[#cc3535] focus:outline-none focus:ring-4 focus:ring-red-100"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-black backdrop-blur-xl transition-all duration-300 focus:border-[#cc3535] focus:outline-none focus:ring-4 focus:ring-red-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#cc3535] py-3 text-base font-semibold text-white shadow-[0_10px_30px_rgba(204,53,53,0.20)] transition-all duration-300 hover:bg-red-700 hover:shadow-lg active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="bx bx-loader-alt animate-spin"></i>
                Checking...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-center text-sm text-[#dc3545] backdrop-blur-md">
            <i className="bx bx-error-circle mr-2"></i>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}