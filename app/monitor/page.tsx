'use client';

/**
 * @fileoverview Monitor display mode selector page (/monitor).
 *
 * Allows hospital staff to launch the public queue monitor TV display for any
 * combination of clinical services or intake stations using interactive checkboxes.
 * Dynamically queries the PostgreSQL `services` catalog, filtering by `show_on_monitor`.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Comprehensive JSDoc with @returns
 * - Strict separation of concerns
 * - Zero emojis in comments or UI
 * - Institutional solid surfaces and light mode design
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

interface SelectableServiceItem {
  id: string;
  serviceName: string;
  subcategory: string | null;
  label: string;
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
 * Unified monitor selection screen for public waiting area TV displays.
 * Staff can select one or multiple services using checkboxes to launch
 * the corresponding single-service or custom multi-service monitor.
 *
 * @returns The rendered monitor selector interface.
 */
export default function MonitorIndexPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MonitorCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const selectableItems = useMemo<SelectableServiceItem[]>(() => {
    const items: SelectableServiceItem[] = [];
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

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedServices(selectableItems.map(item => item.id));
  };

  const handleClearAll = () => {
    setSelectedServices([]);
  };

  const handleSelectClinical = () => {
    const clinicalIds = selectableItems
      .filter(item => !['Registration', 'OPD Card', 'Refill Prescription', 'OPD Reschedule'].includes(item.serviceName))
      .map(item => item.id);
    setSelectedServices(clinicalIds);
  };

  const handleSelectIntake = () => {
    const intakeIds = selectableItems
      .filter(item => ['Registration', 'OPD Card', 'Refill Prescription', 'OPD Reschedule'].includes(item.serviceName))
      .map(item => item.id);
    setSelectedServices(intakeIds);
  };

  const handleLaunch = () => {
    if (selectedServices.length === 0) return;

    if (selectedServices.length === 1) {
      router.push(`/monitor/${encodeURIComponent(selectedServices[0])}`);
      return;
    }

    router.push(`/monitor/Custom?services=${encodeURIComponent(selectedServices.join(','))}`);
  };

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
        <div className="text-center mb-4 sm:mb-6">
          <h1 className={MONITOR_STYLES.selector.title}>
            {MONITOR_TEXTS.selector.title}
          </h1>
          <p className={MONITOR_STYLES.selector.subtitle}>
            {MONITOR_TEXTS.selector.subtitle}
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className={MONITOR_STYLES.selector.actionBar}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAll}
              className={MONITOR_STYLES.selector.actionButtonSecondary}
            >
              {MONITOR_TEXTS.selector.selectAll}
            </button>
            <button
              type="button"
              onClick={handleSelectClinical}
              className={MONITOR_STYLES.selector.actionButtonSecondary}
            >
              Clinical
            </button>
            <button
              type="button"
              onClick={handleSelectIntake}
              className={MONITOR_STYLES.selector.actionButtonSecondary}
            >
              Intake
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className={MONITOR_STYLES.selector.actionButtonSecondary}
            >
              {MONITOR_TEXTS.selector.clearAll}
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-600 ml-1">
              {selectedServices.length} of {selectableItems.length} {MONITOR_TEXTS.selector.selectedCountLabel}
            </span>
          </div>

          <button
            type="button"
            disabled={selectedServices.length === 0}
            onClick={handleLaunch}
            className={MONITOR_STYLES.selector.launchButton}
          >
            <span>
              {selectedServices.length <= 1
                ? MONITOR_TEXTS.selector.launchMonitor
                : 'Launch Multi-Service Monitor'}
            </span>
            {selectedServices.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-black">
                {selectedServices.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin" />
          </div>
        ) : (
          <div className={MONITOR_STYLES.selector.grid}>
            {selectableItems.map(item => {
              const isSelected = selectedServices.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleService(item.id)}
                  className={isSelected ? MONITOR_STYLES.selector.categoryCheckCardActive : MONITOR_STYLES.selector.categoryCheckCard}
                  aria-pressed={isSelected}
                >
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="font-bold text-slate-800 text-sm sm:text-base text-left leading-snug">
                      {item.serviceName}
                    </span>
                    {item.subcategory && (
                      <span className="text-xs font-semibold text-slate-500 text-left mt-0.5">
                        ({item.subcategory})
                      </span>
                    )}
                  </div>
                  <div className={isSelected ? MONITOR_STYLES.selector.checkIndicatorActive : MONITOR_STYLES.selector.checkIndicatorInactive}>
                    {isSelected && <i className="bx bx-check text-base font-black leading-none" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
