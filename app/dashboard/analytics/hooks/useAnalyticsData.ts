"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type AnalyticsRange = "90d" | "180d" | "365d" | "all";

// Wider ranges do more backend work per request (more days of data,
// more ARIMA re-fits even with the 7-day refit interval), so they poll
// less frequently. Narrow ranges stay near-real-time.
const POLL_INTERVAL_MS: Record<AnalyticsRange, number> = {
  "90d":  60_000,   // 1 min
  "180d": 120_000,  // 2 min
  "365d": 180_000,  // 3 min
  "all":  300_000,  // 5 min
};

export function useAnalyticsData() {
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);      // initial load + range change
  const [isRefreshing, setIsRefreshing] = useState(false); // background polls
  const [error, setError]           = useState<string | null>(null);
  const [range, setRange]           = useState<AnalyticsRange>("90d");

  // Tracks whether a fetch was missed while the tab was hidden, so we
  // can catch up immediately when the tab regains focus instead of
  // waiting for the next interval tick.
  const missedWhileHidden = useRef(false);

  const fetchAnalytics = useCallback((isBackground = false) => {
    if (isBackground) setIsRefreshing(true);

    fetch(`http://localhost:8000/api/dashboard-data?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
        setIsRefreshing(false);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        setIsRefreshing(false);
      });
  }, [range]);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(false);

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchAnalytics(true);
        } else {
          // Tab is hidden — skip this tick, but note it so we can
          // refresh immediately once the tab is visible again.
          missedWhileHidden.current = true;
        }
      }, POLL_INTERVAL_MS[range]);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && missedWhileHidden.current) {
        missedWhileHidden.current = false;
        fetchAnalytics(true);
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAnalytics, range]);

  return { data, loading, isRefreshing, error, range, setRange };
}