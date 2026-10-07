/**
 * @fileoverview Custom React hook managing real-time header search across
 * patient queue tickets, clinical departments, and administrative navigation routes.
 *
 * Implements keyboard shortcut interception (Ctrl/Cmd + K, Escape, Arrow navigation, Enter),
 * debounced Supabase querying with injection and bigint type-cast guards, and seamless
 * deep-linking to filtered patient views.
 *
 * @module app/dashboard/hooks/useHeaderSearch
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Normalized patient record returned by header search query.
 */
export interface HeaderSearchPatientResult {
  /** Patient record database ID. */
  id: string;
  /** Queue ticket number (e.g. "P-001"). */
  patientNum: string;
  /** Clinical department or service assigned. */
  service: string;
  /** Current operational status (e.g. "waiting", "serving", "done"). */
  status: string;
  /** Full registration date string. */
  createdAt: string;
  /** Human-readable registration time (HH:MM AM/PM). */
  time?: string;
  /** Masked or normalized contact phone number. */
  phoneNum?: string | null;
  /** Calculated elapsed wait duration in minutes. */
  waitTime?: string | number;
}

/**
 * Quick navigation shortcut link item.
 */
export interface HeaderSearchNavItem {
  /** Unique item identifier. */
  id: string;
  /** Primary label displayed in the search result. */
  title: string;
  /** Descriptive subtext or category context. */
  subtitle: string;
  /** Target router destination URL. */
  href: string;
  /** Boxicons class name. */
  icon: string;
  /** Logical section grouping. */
  category: string;
  /** Extra search keyword triggers. */
  keywords?: readonly string[];
}

/**
 * Union item for keyboard cursor navigation.
 */
export type HeaderSearchResultItem =
  | { type: 'nav'; id: string; navItem: HeaderSearchNavItem }
  | { type: 'patient'; id: string; patientItem: HeaderSearchPatientResult };

/**
 * Master catalog of searchable dashboard destinations and clinical services.
 */
export const NAVIGATION_CATALOG: readonly HeaderSearchNavItem[] = [
  {
    id: 'nav-overview',
    title: 'Dashboard Overview',
    subtitle: 'Live queue monitoring, arrival trends, and executive KPIs',
    href: '/dashboard',
    icon: 'bx-home-alt',
    category: 'Overview',
    keywords: ['home', 'monitoring', 'kpi', 'live'],
  },
  {
    id: 'nav-patients',
    title: 'Patient Records',
    subtitle: 'Inspect 30-day logs, search tickets, and filter departments',
    href: '/dashboard/pages/patients',
    icon: 'bx-male-female',
    category: 'Operations',
    keywords: ['tickets', 'patients', 'records', 'queue', 'table'],
  },
  {
    id: 'nav-cubicles',
    title: 'Cubicles & Rooms Flowchart',
    subtitle: 'Visual consultation pipeline and station room statuses',
    href: '/dashboard/pages/cubicles',
    icon: 'bx-git-repo-forked',
    category: 'Operations',
    keywords: ['flowchart', 'stations', 'doctors', 'rooms', 'pipeline'],
  },
  {
    id: 'nav-analytics',
    title: 'Reports & Analytics',
    subtitle: 'Machine learning wait time forecasts and hourly arrivals',
    href: '/dashboard/pages/analytics',
    icon: 'bxs-report',
    category: 'Intelligence',
    keywords: ['charts', 'predictions', 'ml', 'statistics', 'bottlenecks'],
  },
  {
    id: 'nav-import',
    title: 'Import Patient Data',
    subtitle: 'Staged CSV/Excel batch intake and historical baseline tagging',
    href: '/dashboard/pages/import',
    icon: 'bx-cloud-upload',
    category: 'Data Management',
    keywords: ['upload', 'batch', 'csv', 'excel', 'historical'],
  },
  {
    id: 'nav-export',
    title: 'Export Queue Data',
    subtitle: 'Download filtered audit logs and compliance spreadsheet reports',
    href: '/dashboard/pages/export',
    icon: 'bx-download',
    category: 'Data Management',
    keywords: ['download', 'report', 'audit', 'sheets', 'backup'],
  },
  {
    id: 'service-consultation',
    title: 'Consultation Queue',
    subtitle: 'Doctor consultation department tickets and active queues',
    href: '/dashboard/pages/patients?service=Consultation',
    icon: 'bx-chat',
    category: 'Clinical Services',
    keywords: ['doctor', 'clinic', 'consult'],
  },
  {
    id: 'service-opd',
    title: 'OPD Screening Queue',
    subtitle: 'Outpatient triage and primary assessment queue line',
    href: '/dashboard/pages/patients?service=OPD+Screening',
    icon: 'bx-search-alt-2',
    category: 'Clinical Services',
    keywords: ['triage', 'opd', 'assessment', 'screening'],
  },
  {
    id: 'service-laboratory',
    title: 'Laboratory Queue',
    subtitle: 'Diagnostic lab tests, blood collection, and results',
    href: '/dashboard/pages/patients?service=Laboratory',
    icon: 'bx-test-tube',
    category: 'Clinical Services',
    keywords: ['lab', 'blood', 'tests', 'specimen'],
  },
  {
    id: 'service-pharmacy',
    title: 'Pharmacy Queue',
    subtitle: 'Medication dispensing and prescription fulfillment queue',
    href: '/dashboard/pages/patients?service=Pharmacy',
    icon: 'bx-plus-medical',
    category: 'Clinical Services',
    keywords: ['meds', 'drugs', 'dispense', 'prescriptions'],
  },
  {
    id: 'service-radiology',
    title: 'Radiology Queue',
    subtitle: 'X-ray, ultrasound, echocardiogram, and imaging services',
    href: '/dashboard/pages/patients?service=Radiology',
    icon: 'bx-scan',
    category: 'Clinical Services',
    keywords: ['xray', 'imaging', 'ultrasound', 'scan'],
  },
] as const;

/**
 * Return contract for the {@link useHeaderSearch} hook.
 */
export interface UseHeaderSearchReturn {
  /** Active search query string. */
  query: string;
  /** Updates the active search query. */
  setQuery: (q: string) => void;
  /** Whether the interactive results dropdown is visible. */
  isOpen: boolean;
  /** Toggles the dropdown visibility state. */
  setIsOpen: (open: boolean) => void;
  /** Whether a debounced Supabase patient query is currently executing. */
  isLoading: boolean;
  /** Filtered navigation shortcuts matching the query or default suggestions. */
  navResults: HeaderSearchNavItem[];
  /** Filtered patient tickets matching the query. */
  patientResults: HeaderSearchPatientResult[];
  /** Flattened array of results for linear keyboard arrow navigation. */
  flatResults: HeaderSearchResultItem[];
  /** Current highlighted result index (-1 if none). */
  selectedIndex: number;
  /** Updates the highlighted result index. */
  setSelectedIndex: (idx: number) => void;
  /** Whether the responsive mobile search overlay dialog is open. */
  mobileOpen: boolean;
  /** Toggles the responsive mobile search overlay dialog. */
  setMobileOpen: (open: boolean) => void;
  /** Input element DOM reference. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Mobile input element DOM reference. */
  mobileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Search container wrapper DOM reference for click-outside detection. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Keyboard event handler for arrow keys, Enter, and Escape. */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Callback fired when a result item is clicked or selected. */
  handleSelectResult: (item: HeaderSearchResultItem) => void;
  /** Resets the search query and closes dropdown. */
  handleClear: () => void;
  /** Submits the query, navigating to the patient records page. */
  handleSubmitQuery: () => void;
}

/**
 * Helper to normalize phone numbers for presentation.
 *
 * @param rawPhone - Raw integer or string representation.
 * @returns Formatted phone number or null.
 */
function formatPhoneNumber(rawPhone: unknown): string | null {
  if (rawPhone === null || rawPhone === undefined || rawPhone === '') return null;
  const str = String(rawPhone).trim();
  if (!str || str === '0') return null;
  if (str.startsWith('enc:v1:')) return 'Protected';
  if (/^\d{10}$/.test(str)) return `0${str}`;
  return str;
}

/**
 * Manages search state, shortcut keybindings, debounced queries, and keyboard focus.
 *
 * @returns State and event handlers for the HeaderSearch component.
 */
export function useHeaderSearch(): UseHeaderSearchReturn {
  const router = useRouter();

  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [patientResults, setPatientResults] = useState<HeaderSearchPatientResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef<number>(0);

  // Debounce user keystrokes by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Global Ctrl/Cmd + K shortcut listener to focus the search bar
  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
        if (window.innerWidth < 768) {
          setMobileOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  // Click-outside listener to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter navigation links based on query
  const navResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Return top 6 default quick shortcuts when query is empty
      return NAVIGATION_CATALOG.slice(0, 6);
    }

    return NAVIGATION_CATALOG.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchSubtitle = item.subtitle.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchKeywords = item.keywords?.some((k) =>
        k.toLowerCase().includes(trimmed)
      );

      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    }).slice(0, 5);
  }, [query]);

  // Query Supabase for matching patient queue tickets
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (!trimmed) {
      setPatientResults([]);
      setIsLoading(false);
      return;
    }

    const currentReqId = ++requestIdRef.current;
    const isStale = () => currentReqId !== requestIdRef.current;

    async function searchPatients() {
      setIsLoading(true);

      try {
        const cleanTerm = trimmed.replace(/[,()]/g, '');
        const digitsOnly = trimmed.replace(/\D/g, '');
        const now = new Date();

        let queryBuilder = supabase
          .from('patients')
          .select('id, patientNum, service, status, created_at, consult_start, phoneNum')
          .order('created_at', { ascending: false })
          .limit(6);

        const orConditions: string[] = [];

        // Ticket number substring match
        if (cleanTerm) {
          orConditions.push(`patientNum.ilike.%${cleanTerm}%`);
          orConditions.push(`service.ilike.%${cleanTerm}%`);
          orConditions.push(`status.ilike.%${cleanTerm}%`);
        }

        // Safe integer check for ID to prevent bigint cast error
        if (digitsOnly.length > 0 && digitsOnly.length <= 15) {
          const idNum = Number(digitsOnly);
          if (Number.isSafeInteger(idNum) && idNum > 0) {
            orConditions.push(`id.eq.${idNum}`);
          }
        }

        // Safe integer check for Phone number
        if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
          const exactPhone = Number(digitsOnly);
          if (Number.isSafeInteger(exactPhone)) {
            orConditions.push(`phoneNum.eq.${exactPhone}`);
          }
          if (digitsOnly.startsWith('0')) {
            const strippedPhone = Number(digitsOnly.slice(1));
            if (Number.isSafeInteger(strippedPhone)) {
              orConditions.push(`phoneNum.eq.${strippedPhone}`);
            }
          }
        }

        if (orConditions.length > 0) {
          queryBuilder = queryBuilder.or(orConditions.join(','));
        }

        const { data, error } = await queryBuilder;

        if (isStale()) return;

        if (error) {
          console.warn('Header search database query notice:', error.message);
          setPatientResults([]);
          return;
        }

        const transformed: HeaderSearchPatientResult[] = (data || []).map((row: any) => {
          let calculatedWait: string | number = '--';
          if (row.created_at) {
            const registeredTime = new Date(row.created_at).getTime();
            const consultTime = row.consult_start
              ? new Date(row.consult_start).getTime()
              : now.getTime();
            calculatedWait = `${Math.max(0, Math.floor((consultTime - registeredTime) / 60000))}m`;
          }

          const createdAtDate = row.created_at ? new Date(row.created_at) : new Date();

          return {
            id: String(row.id),
            patientNum: row.patientNum || '',
            service: row.service || 'Unknown',
            status: row.status || 'Unknown',
            createdAt: createdAtDate.toLocaleString(),
            time: row.created_at
              ? new Date(row.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined,
            phoneNum: formatPhoneNumber(row.phoneNum),
            waitTime: calculatedWait,
          };
        });

        setPatientResults(transformed);
      } catch (err: any) {
        if (!isStale()) {
          console.error('Header search error:', err);
          setPatientResults([]);
        }
      } finally {
        if (!isStale()) {
          setIsLoading(false);
        }
      }
    }

    void searchPatients();
  }, [debouncedQuery]);

  // Combine items for linear arrow keyboard navigation
  const flatResults = useMemo<HeaderSearchResultItem[]>(() => {
    const list: HeaderSearchResultItem[] = [];

    navResults.forEach((nav) => {
      list.push({ type: 'nav', id: nav.id, navItem: nav });
    });

    patientResults.forEach((pat) => {
      list.push({ type: 'patient', id: `pat-${pat.id}`, patientItem: pat });
    });

    return list;
  }, [navResults, patientResults]);

  // Reset keyboard cursor when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [flatResults.length]);

  /**
   * Dispatches navigation when an item is selected.
   */
  const handleSelectResult = useCallback(
    (item: HeaderSearchResultItem) => {
      setIsOpen(false);
      setMobileOpen(false);

      if (item.type === 'nav') {
        router.push(item.navItem.href);
      } else {
        const queryTerm = item.patientItem.patientNum || item.patientItem.id;
        router.push(
          `/dashboard/pages/patients?search=${encodeURIComponent(queryTerm)}`
        );
      }
    },
    [router]
  );

  /**
   * Navigates to patient records pre-filtered with the full active query.
   */
  const handleSubmitQuery = useCallback(() => {
    const trimmed = query.trim();
    setIsOpen(false);
    setMobileOpen(false);

    if (trimmed) {
      router.push(
        `/dashboard/pages/patients?search=${encodeURIComponent(trimmed)}`
      );
    } else {
      router.push('/dashboard/pages/patients');
    }
  }, [query, router]);

  /**
   * Resets query and dismisses dropdown.
   */
  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setPatientResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  }, []);

  /**
   * Handles keyboard navigation inside the search bar.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        setSelectedIndex((prev) =>
          prev <= 0 ? flatResults.length - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
          handleSelectResult(flatResults[selectedIndex]);
        } else {
          handleSubmitQuery();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setMobileOpen(false);
        inputRef.current?.blur();
      }
    },
    [isOpen, flatResults, selectedIndex, handleSelectResult, handleSubmitQuery]
  );

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    isLoading,
    navResults,
    patientResults,
    flatResults,
    selectedIndex,
    setSelectedIndex,
    mobileOpen,
    setMobileOpen,
    inputRef,
    mobileInputRef,
    containerRef,
    handleKeyDown,
    handleSelectResult,
    handleClear,
    handleSubmitQuery,
  };
}

export default useHeaderSearch;
