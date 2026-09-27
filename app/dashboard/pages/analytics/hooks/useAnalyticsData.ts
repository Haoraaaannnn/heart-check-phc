/**
 * @fileoverview Custom React hook for fetching and polling queue analytics, forecasting,
 * and bottleneck insights from the FastAPI backend.
 *
 * Implements session-scoped per-range caching, visibility change listeners,
 * and adaptive polling intervals based on range size.
 *
 * @module app/dashboard/pages/analytics/hooks/useAnalyticsData
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  POLL_INTERVAL_MS,
  CACHE_STALE_MS,
} from '@/app/dashboard/pages/analytics/constants/analytics';

export type AnalyticsRange = '90d' | '180d' | '365d' | 'all';

interface CacheEntry {
  data: any;
  fetchedAt: number;
}

/**
 * Manages fetching, caching, and auto-refresh of analytics data for the selected date range.
 *
 * @returns State properties: current data, loading/refreshing flags, error, range, and range setter.
 */
export function useAnalyticsData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<AnalyticsRange>('90d');

  const cacheRef = useRef<Partial<Record<AnalyticsRange, CacheEntry>>>({});
  const missedWhileHidden = useRef(false);
  const requestRangeRef = useRef<AnalyticsRange>(range);

  const fetchAnalytics = useCallback((forRange: AnalyticsRange, isBackground = false) => {
    if (isBackground) setIsRefreshing(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    fetch(`${baseUrl}/api/dashboard-data?range=${forRange}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        cacheRef.current[forRange] = { data: json, fetchedAt: Date.now() };

        if (requestRangeRef.current === forRange) {
          setData(json);
          setLoading(false);
          setIsRefreshing(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (requestRangeRef.current === forRange) {
          setError(err.message);
          setLoading(false);
          setIsRefreshing(false);
        }
      });
  }, []);

  // When range changes: serve from cache if fresh, otherwise fetch
  useEffect(() => {
    requestRangeRef.current = range;
    const cached = cacheRef.current[range];
    const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_STALE_MS;

    if (cached) {
      setData(cached.data);
      setLoading(false);
      setError(null);

      if (!isFresh) {
        fetchAnalytics(range, true);
      }
    } else {
      setLoading(true);
      setError(null);
      fetchAnalytics(range, false);
    }
  }, [range, fetchAnalytics]);

  // Periodic polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) {
        missedWhileHidden.current = true;
        return;
      }
      fetchAnalytics(range, true);
    }, POLL_INTERVAL_MS[range] ?? 60_000);

    return () => clearInterval(interval);
  }, [range, fetchAnalytics]);

  // Tab visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && missedWhileHidden.current) {
        missedWhileHidden.current = false;
        fetchAnalytics(range, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [range, fetchAnalytics]);

  return { data, loading, isRefreshing, error, range, setRange };
}
