/**
 * @fileoverview Shared context provider for longitudinal historical analytics in the Admin Dashboard.
 *
 * Implements a session-scoped caching architecture:
 * 1. Reads cached analytics from browser sessionStorage on layout mount to provide instantaneous
 *    0ms baseline rendering without repeated network fetches.
 * 2. Fetches fresh analytics from the FastAPI analytics endpoint (/api/dashboard-data?range=all)
 *    only when the session cache is missing, expired (TTL 15 min), or explicitly refreshed.
 * 3. Shares longitudinal performance metrics (system status, primary bottleneck, average journey duration,
 *    forecasting summary, and departmental service distribution) across Dashboard Overview and Patients pages.
 *
 * @remarks
 * Conforms strictly to AGENTS.md enterprise documentation and zero emoji guidelines.
 *
 * @module app/dashboard/context/HistoricalSummaryContext
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

/**
 * Value exposed by the {@link HistoricalSummaryContext}.
 */
export interface HistoricalSummaryContextValue {
  /** Longitudinal historical data payload from backend analytics, or null while loading. */
  historicalData: any;
  /** Whether the initial background analytics query is actively loading. */
  historicalLoading: boolean;
  /** Error message string if the analytics request failed, or null if healthy. */
  historicalError: string | null;
  /** Imperative handler to bypass cache and re-fetch latest analytics payload from backend. */
  refreshHistorical: () => Promise<void>;
}

const HistoricalSummaryContext = createContext<HistoricalSummaryContextValue>({
  historicalData: null,
  historicalLoading: true,
  historicalError: null,
  refreshHistorical: async () => {},
});

/**
 * Key used to store longitudinal historical analytics in browser sessionStorage.
 */
const STORAGE_KEY = 'phc_historical_summary_cache_v1';

/**
 * Duration in milliseconds before client-side session cache is considered stale (15 minutes).
 */
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Provider wrapping the Admin Dashboard workspace with shared longitudinal historical analytics.
 *
 * @param props - Component props containing child workspace nodes.
 * @returns JSX element wrapping children with HistoricalSummaryContext.
 */
export function HistoricalSummaryProvider({ children }: { children: ReactNode }) {
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  /**
   * Fetches the longitudinal historical analytics payload, checking sessionStorage first.
   *
   * @param force - If true, bypasses sessionStorage and executes a fresh network request.
   */
  const fetchHistorical = useCallback(async (force = false) => {
    // 1. Inspect sessionStorage cache for an unexpired payload
    if (!force && typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const age = Date.now() - (parsed.timestamp || 0);
          if (parsed && parsed.data && age < CACHE_TTL_MS) {
            setHistoricalData(parsed.data);
            setHistoricalLoading(false);
            setHistoricalError(null);
            return;
          }
        }
      } catch {
        // Storage parse error fallback to live fetch
      }
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/dashboard-data?range=all`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();

      setHistoricalData(json);
      setHistoricalLoading(false);
      setHistoricalError(null);

      // 2. Persist fresh payload to sessionStorage
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ data: json, timestamp: Date.now() })
          );
        } catch {
          // Suppress quota exceeded errors on restricted browsers
        }
      }
    } catch (err: any) {
      setHistoricalError(err.message || 'Failed to load historical analytics');
      setHistoricalLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistorical(false);
  }, [fetchHistorical]);

  return (
    <HistoricalSummaryContext.Provider
      value={{
        historicalData,
        historicalLoading,
        historicalError,
        refreshHistorical: () => fetchHistorical(true),
      }}
    >
      {children}
    </HistoricalSummaryContext.Provider>
  );
}

/**
 * Accesses shared longitudinal historical analytics within the dashboard hierarchy.
 *
 * @returns {@link HistoricalSummaryContextValue} containing data, loading state, and refresh handler.
 */
export function useHistoricalSummary(): HistoricalSummaryContextValue {
  return useContext(HistoricalSummaryContext);
}