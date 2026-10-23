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
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

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
      <div className={MONITOR_STYLES.selector.container}>
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={MONITOR_STYLES.selector.backButton}
          title={MONITOR_TEXTS.selector.backToCategories}
          aria-label={MONITOR_TEXTS.selector.backToCategories}
        >
          <i className={MONITOR_STYLES.selector.backIcon} aria-hidden="true" />
          <span className={MONITOR_STYLES.selector.backLabel}>
            {MONITOR_TEXTS.selector.backToCategories}
          </span>
        </button>
        <h1 className={MONITOR_STYLES.selector.title}>
          {MONITOR_TEXTS.selector.typeSelectionPrefix}{selectedCategory}{MONITOR_TEXTS.selector.typeSelectionSuffix}
        </h1>
        <div className={MONITOR_STYLES.selector.subGrid}>
          {SUB_CATEGORIES.map(sub => (
            <button
              key={sub}
              type="button"
              onClick={() => handleSubCategoryClick(sub)}
              className={MONITOR_STYLES.selector.categoryButton}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={MONITOR_STYLES.selector.container}>
      <button
        type="button"
        onClick={() => router.push('/select-screen')}
        className={MONITOR_STYLES.selector.backButton}
        title={MONITOR_TEXTS.selector.returnToSelectScreenTitle}
        aria-label={MONITOR_TEXTS.selector.returnToSelectScreenTitle}
      >
        <i className={MONITOR_STYLES.selector.backIcon} aria-hidden="true" />
        <span className={MONITOR_STYLES.selector.backLabel}>
          {MONITOR_TEXTS.selector.backToSelectScreen}
        </span>
      </button>
      <h1 className={MONITOR_STYLES.selector.title}>
        {MONITOR_TEXTS.selector.title}
      </h1>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin" />
        </div>
      ) : (
        <div className={MONITOR_STYLES.selector.grid}>
          {categories.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={MONITOR_STYLES.selector.categoryButton}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}