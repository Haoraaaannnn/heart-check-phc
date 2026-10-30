/** @fileoverview Recoverable kiosk read failures that release the navigation loading overlay. */
'use client';
import { useEffect } from 'react';
import { useKioskLoading } from '@/app/kiosk/context/KioskLoadingContext';

/** @returns A patient-friendly retry screen without exposing database diagnostics or replaying a ticket write. */
export default function KioskError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { hideLoading } = useKioskLoading();
  useEffect(() => { hideLoading(); }, [hideLoading]);
  return <section role="alert" className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center text-slate-800">
    <h1 className="text-3xl font-bold">We couldn’t load this page</h1>
    <p className="max-w-xl text-xl">Please try again. If it still won’t load, ask staff for assistance.</p>
    <button type="button" onClick={reset} className="rounded-xl bg-[#cc3535] px-8 py-4 text-xl font-bold text-white">Try again</button>
  </section>;
}
