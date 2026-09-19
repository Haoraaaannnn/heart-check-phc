'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ServiceFilterBarProps {
    selected: string | null;
    onSelect: (service: string | null) => void;
}

const chipBase =
    'shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition whitespace-nowrap';
const chipActive = 'bg-red-600 border-red-600 text-white';
const chipIdle =
    'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

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