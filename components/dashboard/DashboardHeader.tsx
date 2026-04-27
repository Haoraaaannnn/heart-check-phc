'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// 1. Import the theme tools
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function DashboardHeader() {
  const router = useRouter();
  
  // 2. Setup theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering the toggle after mount
  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (

    <header className="rounded-[30px] m-3 bg-white/35 border border-white/40 shadow-[0_10px_40px_rgba(255,120,120,0.06)]
     px-6 py-4 flex justify-between items-center sticky top-3 z-20 backdrop-blur-xl
     dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20">
      
      <div className="flex items-center gap-4">
        {/* Update text colors for dark mode */}
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        
        {/* 4. The Dark Mode Toggle Button */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm border border-gray-200 dark:border-gray-700"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        )}

        <div className="text-right">
          {/* Update welcome text colors */}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Welcome back</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin User</p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}