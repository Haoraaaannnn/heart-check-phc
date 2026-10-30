/** @fileoverview Display settings entry point for staff pages without an account-settings menu. */
'use client';
import { useRef } from 'react';
import { DisplaySettingsCard } from './DisplaySettingsCard';

/** @returns A compact display trigger and a native modal with keyboard and focus containment. */
export function DisplaySettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} aria-label="Display settings" title="Display settings"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <i className="bx bx-font-size text-lg" aria-hidden="true" /><span>Display</span>
    </button>
    <dialog ref={dialog} aria-label="Display settings" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl backdrop:bg-black/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="mb-4 flex justify-end"><button type="button" onClick={() => dialog.current?.close()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">Close</button></div>
      <DisplaySettingsCard />
    </dialog>
  </>;
}
