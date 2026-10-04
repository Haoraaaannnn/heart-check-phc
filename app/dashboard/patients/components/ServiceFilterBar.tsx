'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ServiceFilterBarProps {
    selected: string | null;
    onSelect: (service: string | null) => void;
}

const chipBase =
    'shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition whitespace-nowrap';
const chipActive = 'bg-[#a8071a] border-[#a8071a] text-white shadow-2xs font-bold';
const chipIdle =
    'bg-slate-50 dark:bg-[#1f1f1f] border-slate-200 dark:border-[#2e2e2e] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#242424]';

export default function ServiceFilterBar({ selected, onSelect }: ServiceFilterBarProps) {
    const [services, setServices] = useState<string[]>([]);

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
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by service">
        <button
        type="button"
        onClick={() => onSelect(null)}
        className={`${chipBase} ${selected === null ? chipActive : chipIdle}`}
        >
        All Services
        </button>

        {services.map((label) => (
        <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            className={`${chipBase} ${selected === label ? chipActive : chipIdle}`}
        >
            {label}
        </button>
        ))}
    </div>
  );
}