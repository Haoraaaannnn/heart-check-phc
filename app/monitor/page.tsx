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
import { useState, useEffect, useMemo } from 'react';
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
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const customSelectableItems = useMemo(() => {
    const items: { id: string; serviceName: string; subcategory: string | null; label: string }[] = [];
    for (const cat of categories) {
      if (cat.hasSubcategories) {
        for (const sub of SUB_CATEGORIES) {
          items.push({
            id: `${cat.name}-${sub}`,
            serviceName: cat.name,
            subcategory: sub,
            label: `${cat.name} - ${sub}`,
          });
        }
      } else {
        items.push({
          id: cat.name,
          serviceName: cat.name,
          subcategory: null,
          label: cat.name,
        });
      }
    }
    return items;
  }, [categories]);

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
    if (isCustomMode) {
      toggleService(cat.name);
      return;
    }
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

  const toggleService = (name: string) => {
    setSelectedServices(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
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
        <div className={MONITOR_STYLES.selector.contentWrapper}>
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

      <div className={MONITOR_STYLES.selector.contentWrapper}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full max-w-3xl mb-4 gap-3 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-700">
            {MONITOR_TEXTS.selector.title}
          </h1>

          {/* Mode Switcher: Single vs Custom Multi-Service */}
          <div className={MONITOR_STYLES.selector.modeTabsWrap}>
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={!isCustomMode ? MONITOR_STYLES.selector.modeTabActive : MONITOR_STYLES.selector.modeTabInactive}
            >
              {MONITOR_TEXTS.selector.singleModeToggle}
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={isCustomMode ? MONITOR_STYLES.selector.modeTabActive : MONITOR_STYLES.selector.modeTabInactive}
            >
              {MONITOR_TEXTS.selector.customModeToggle}
            </button>
          </div>
        </div>

        {/* Action Bar for Custom Mode */}
        {isCustomMode && (
          <div className={MONITOR_STYLES.selector.actionBar}>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedServices(customSelectableItems.map(c => c.id))}
                className={MONITOR_STYLES.selector.actionButtonSecondary}
              >
                {MONITOR_TEXTS.selector.selectAll}
              </button>
              <button
                type="button"
                onClick={() => setSelectedServices([])}
                className={MONITOR_STYLES.selector.actionButtonSecondary}
              >
                {MONITOR_TEXTS.selector.clearAll}
              </button>
              <span className="text-xs sm:text-sm font-bold text-slate-600 ml-1">
                {selectedServices.length} {MONITOR_TEXTS.selector.selectedServicesCount}
              </span>
            </div>

            <button
              type="button"
              disabled={selectedServices.length === 0}
              onClick={() => {
                if (selectedServices.length > 0) {
                  router.push(`/monitor/Custom?services=${encodeURIComponent(selectedServices.join(','))}`);
                }
              }}
              className={MONITOR_STYLES.selector.launchButton}
            >
              {MONITOR_TEXTS.selector.launchCustomMonitor} ({selectedServices.length})
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin" />
          </div>
        ) : isCustomMode ? (
          <div className={MONITOR_STYLES.selector.grid}>
            {customSelectableItems.map(item => {
              const isSelected = selectedServices.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleService(item.id)}
                  className={`${MONITOR_STYLES.selector.categoryCheckCard} ${isSelected ? 'border-[#cc3535] bg-red-50/20 shadow-md' : 'border-slate-200'}`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-bold text-slate-800 text-sm sm:text-base text-left">
                      {item.serviceName}
                    </span>
                    {item.subcategory && (
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border w-fit mt-1 ${
                          item.subcategory.toLowerCase() === 'pedia'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        }`}
                      >
                        {item.subcategory}
                      </span>
                    )}
                  </div>
                  <div className={isSelected ? MONITOR_STYLES.selector.checkIndicatorActive : MONITOR_STYLES.selector.checkIndicatorInactive}>
                    {isSelected && <i className="bx bx-check text-base font-black" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
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
    </div>
  );
}