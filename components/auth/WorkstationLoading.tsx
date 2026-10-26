/** @fileoverview Clear workstation loading feedback and recovery without ending the session. */
'use client';
import { useEffect, useState } from 'react';

/**
 * Keeps pending access checks closed while offering recovery for slow connections.
 * @param props - Loading title, optional failure, and a retry limited to the current page.
 * @returns An accessible loading or retry panel on a solid workstation surface.
 */
export function WorkstationLoading({ title, error, onRetry }: {
  title: string; error?: string; onRetry?: () => void;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 10_000);
    return () => clearTimeout(timer);
  }, []);
  return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
    <div className="max-w-md text-center space-y-4">
      {!error && <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-700" />}
      <p role={error ? 'alert' : 'status'} className="font-semibold text-slate-800 dark:text-slate-100">{error || title}</p>
      {(slow || error) && <>
        <p className="text-sm text-slate-600 dark:text-slate-300">The connection is taking longer than expected. You can retry this page; your other tabs will stay signed in.</p>
        <button type="button" onClick={onRetry ?? (() => window.location.reload())}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">Retry loading</button>
      </>}
    </div>
  </div>;
}
