'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface HistoricalSummaryContextValue {
  historicalData: any;
  historicalLoading: boolean;
  historicalError: string | null;
}

const HistoricalSummaryContext = createContext<HistoricalSummaryContextValue>({
  historicalData: null,
  historicalLoading: true,
  historicalError: null,
});

export function HistoricalSummaryProvider({ children }: { children: ReactNode }) {
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  useEffect(() => {
    // Fetched once at the dashboard layout level and shared via context —
    // avoids every page (Overview, Patients, Consultation, etc.) making
    // its own duplicate call to the same historical dataset.
    fetch('http://localhost:8000/api/dashboard-data?range=all')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setHistoricalData(json);
        setHistoricalLoading(false);
      })
      .catch((err) => {
        setHistoricalError(err.message);
        setHistoricalLoading(false);
      });
  }, []);

  return (
    <HistoricalSummaryContext.Provider value={{ historicalData, historicalLoading, historicalError }}>
      {children}
    </HistoricalSummaryContext.Provider>
  );
}

export function useHistoricalSummary() {
  return useContext(HistoricalSummaryContext);
}