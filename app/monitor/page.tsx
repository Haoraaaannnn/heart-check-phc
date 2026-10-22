'use client';

/**
 * @fileoverview Monitor display mode selector page (/monitor).
 *
 * Allows hospital staff to launch the public queue monitor TV display for any
 * active clinical service or registration intake station.
 * Dynamically queries the PostgreSQL `services` catalog, filtering by `show_on_monitor`.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Comprehensive JSDoc with @returns
 * - Strict separation of concerns
 * - Zero emojis in comments or UI
 *
 * @module app/monitor/page
 */

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MonitorCategory {
  name: string;
  hasSubcategories: boolean;
}

const DEFAULT_CATEGORIES: MonitorCategory[] = [
  { name: 'Consultation', hasSubcategories: true },
  { name: 'Registration', hasSubcategories: false },
  { name: 'OPD Card', hasSubcategories: false },
  { name: 'Refill Prescription', hasSubcategories: false },
  { name: 'ECG', hasSubcategories: false },
  { name: 'Warfarin', hasSubcategories: false },
  { name: 'OPD Reschedule', hasSubcategories: false },
  { name: 'Benzathine', hasSubcategories: false },
  { name: 'OPD Screening', hasSubcategories: true },
];

const SUB_CATEGORIES = ['Pedia', 'Adult'];

/**
 * Monitor selection screen for public waiting area TV displays.
 *
 * @returns The rendered monitor selector interface.
 */
export default function MonitorIndexPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<MonitorCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      try {
        const { data } = await supabase
          .from('services')
          .select('label_en, has_subcategories, show_on_monitor')
          .order('display_order', { ascending: true });

        if (!isMounted) return;

        if (data && data.length > 0) {
          const monitorServices: MonitorCategory[] = data
            .filter((s: { show_on_monitor?: boolean | null }) => s.show_on_monitor !== false)
            .map((s: { label_en: string; has_subcategories?: boolean | null }) => ({
              name: s.label_en,
              hasSubcategories: !!s.has_subcategories,
            }));

          const hasReg = monitorServices.some((s) => s.name === 'Registration');
          const finalList = hasReg
            ? monitorServices
            : [{ name: 'Registration', hasSubcategories: false }, ...monitorServices];

          setCategories(finalList);
        }
      } catch {
        // Fallback to DEFAULT_CATEGORIES upon network or database fault
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchServices();

    const channel = supabase
      .channel('monitor-hub-services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCategoryClick = (cat: MonitorCategory) => {
    if (cat.hasSubcategories) {
      setSelectedCategory(cat.name);
    } else {
      router.push(`/monitor/${encodeURIComponent(cat.name)}`);
    }
  };

  const handleSubCategoryClick = (sub: string) => {
    if (selectedCategory) {
      router.push(`/monitor/${encodeURIComponent(selectedCategory)}-${encodeURIComponent(sub)}`);
    }
  };

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-12 text-slate-800">
        <button
          onClick={() => setSelectedCategory(null)}
          className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group cursor-pointer"
        >
          <i className="bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          <span className="text-sm font-medium">Back to Categories</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-700">Select {selectedCategory} Type</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {SUB_CATEGORIES.map(sub => (
            <button
              key={sub}
              onClick={() => handleSubCategoryClick(sub)}
              className="bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-3xl p-6 text-gray-700 font-semibold text-sm shadow-sm transition text-left cursor-pointer"
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-12 text-slate-800">
      <button
        onClick={() => router.push('/select-screen')}
        className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group cursor-pointer"
        title="Return to Select Screen"
        aria-label="Return to Select Screen"
      >
        <i className="bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
        <span className="text-sm font-medium">Back to Select Screen</span>
      </button>
      <h1 className="text-3xl font-bold text-gray-700">Select Monitor</h1>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat)}
              className="bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-3xl p-6 text-gray-700 font-semibold text-sm shadow-sm transition text-left cursor-pointer"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}