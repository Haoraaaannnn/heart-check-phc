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
      setError('User not found');
      return;
    }

    if (data.role === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/nurseDashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-white via-red-50 to-red-100 px-5 font-sans">
      <div className="bg-white rounded-lg shadow-[0_10px_25px_rgba(204,204,204,0.514)] pt-10 px-10 pb-8 w-full max-w-md">

        <h1 className="text-center text-[#000000] text-[28px] font-semibold mb-8">Login</h1>
        <h2 className="text-center text-[#000000] text-[10px] -mt-7 mb-5">
          Enter your credentials to access your account
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-[#5c5858] font-medium">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border border-[#ddd] rounded text-sm text-black transition-colors duration-300 focus:outline-none focus:border-[#3599CC]"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-[#5c5858] font-medium">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-3 border border-[#ddd] rounded text-sm text-black transition-colors duration-300 focus:outline-none focus:border-[#3599CC]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-[#3599CC] hover:bg-[#1675a5] text-white rounded text-base font-semibold transition-colors duration-300 disabled:opacity-60"
          >
            {loading ? 'Checking...' : 'LOGIN'}
          </button>
        </form>

        {error && (
          <div className="mt-4 px-3 py-3 text-center text-[#dc3545] bg-[#f8d7da] border border-[#f5c6cb] rounded">
            {error}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-[#eee] text-center text-sm text-[#5c5858]">
        </div>
      </div>
    </div>
  );
}