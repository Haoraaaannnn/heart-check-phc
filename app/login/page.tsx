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
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-white via-red-50 to-red-100 px-5 font-sans">
      
      <button
        onClick={() => router.push('/')}
        className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group"
      >
        <i className="bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl pt-10 px-10 pb-8 w-full max-w-md border-2 border-red-100">
        
        <h1 className="text-center text-gray-800 text-2xl font-bold mb-2">Staff Login</h1>
        <p className="text-center text-gray-400 text-xs mb-8">Enter your credentials to access your account</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-gray-600 font-medium text-sm">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm text-black transition-all duration-300 focus:outline-none focus:border-[#cc3535] focus:shadow-md bg-gray-50"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-600 font-medium text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm text-black transition-all duration-300 focus:outline-none focus:border-[#cc3535] focus:shadow-md bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#cc3535] hover:bg-red-700 text-white rounded-xl text-base font-semibold transition-all duration-300 disabled:opacity-60 shadow-md hover:shadow-lg active:scale-95"
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
          <div className="mt-4 px-4 py-3 text-center text-[#dc3545] bg-[#f8d7da] border border-[#f5c6cb] rounded-xl text-sm">
            <i className="bx bx-error-circle mr-2"></i>
            {error}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">

        </div>
      </div>
    </div>
  );
}