/**
 * @fileoverview Service filter chip bar component for filtering patients by department.
 *
 * Fetches available service categories from Supabase and allows single-selection
 * toggle or "All Services" resetting.
 *
 * @module app/dashboard/pages/patients/components/ServiceFilterBar
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PATIENTS_STYLES } from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface ServiceFilterBarProps {
  /** The currently selected service name, or null for all services. */
  selected: string | null;
  /** Callback fired when a service chip is clicked. */
  onSelect: (service: string | null) => void;
  /** Optional specific date filter (YYYY-MM-DD or null). */
  selectedDate?: string | null;
  /** Callback fired when a date is selected or cleared. */
  onDateSelect?: (date: string | null) => void;
}

/**
 * Filter chip bar allowing switching between medical services and filtering by clinic date.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ServiceFilterBar({
  selected,
  onSelect,
  selectedDate,
  onDateSelect,
}: ServiceFilterBarProps) {
  const [services, setServices] = useState<string[]>([]);
  const S = PATIENTS_STYLES.filterBar;
  const T = PATIENTS_TEXTS.filterBar;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('services')
        .select('label_en, display_order')
        .order('display_order', { ascending: true });

      if (data) setServices(data.map((s) => s.label_en));
    };
    load();

    const channel = supabase
      .channel('service-filter-bar-services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
      {/* Service chips */}
      <div className={S.container} aria-label={T.ariaLabel}>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`${S.chipBase} ${selected === null ? S.chipActive : S.chipIdle}`}
        >
          {T.allServices}
        </button>

        {services.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            className={`${S.chipBase} ${selected === label ? S.chipActive : S.chipIdle}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Specific Date Filter */}
      {onDateSelect && (
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 self-start sm:self-auto ${
            selectedDate
              ? 'border-[#a8071a] bg-[#a8071a]/10 text-[#a8071a] dark:text-[#f87171]'
              : 'border-line bg-surface text-content-muted hover:border-slate-400'
          }`}
        >
          <i className="bx bx-calendar text-sm" />
          <span className="text-[11px] font-bold whitespace-nowrap">Filter Date:</span>
          <input
            type="date"
            value={selectedDate || ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateSelect(e.target.value || null)}
            className="bg-transparent text-xs font-semibold text-content outline-none cursor-pointer"
            aria-label="Filter patient records by specific date"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => onDateSelect(null)}
              className="text-content-subtle hover:text-content text-sm cursor-pointer ml-1"
              title="Clear date filter"
              aria-label="Clear date filter"
            >
              <i className="bx bx-x" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
