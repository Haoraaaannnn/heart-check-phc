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
}

/**
 * Filter chip bar allowing switching between medical services.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ServiceFilterBar({ selected, onSelect }: ServiceFilterBarProps) {
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
  }, []);

  return (
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
  );
}
