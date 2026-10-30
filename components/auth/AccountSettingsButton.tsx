/** @fileoverview Shared account settings dialog for authenticated staff workstations. */
'use client';

import { useRef, useState } from 'react';
import { ChangePasswordCard } from '@/app/superadmin/components/ChangePasswordCard';
import { DisplaySettingsCard } from '@/components/display/DisplaySettingsCard';

/**
 * Opens personal password settings without leaving the active workstation.
 * @param props - Optional expanded sidebar presentation.
 * @returns A settings trigger and a native modal with focus containment and Escape support.
 */
export function AccountSettingsButton({ expanded = false, sidebar = false }: { expanded?: boolean; sidebar?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  /** @returns Completion after opening the modal and mounting a fresh form. */
  function openSettings() {
    setIsOpen(true);
    dialogRef.current?.showModal();
  }
  /** @returns Completion after clearing the form from memory. */
  function closeSettings() {
    if (saving) return;
    dialogRef.current?.close();
    setIsOpen(false);
  }
  const buttonClass = sidebar
    ? `w-full flex items-center ${expanded ? 'justify-start px-3' : 'justify-center'} gap-3 py-2 rounded-xl text-sm font-medium`
    : 'flex items-center gap-2 rounded-lg p-2 text-sm';
  return <>
    <button type="button" onClick={openSettings} title="Account settings" aria-label="Account settings"
      className={`${buttonClass} text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer`}>
      <i className="bx bx-cog text-xl shrink-0" aria-hidden="true" />
      {(!sidebar || expanded) && <span>Account settings</span>}
    </button>
    <dialog ref={dialogRef} aria-labelledby="account-settings-title"
      onCancel={(event) => { event.preventDefault(); closeSettings(); }}
      onClose={() => setIsOpen(false)}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl backdrop:bg-black/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="account-settings-title" className="text-lg font-bold">Account settings</h2>
        <button type="button" onClick={closeSettings} disabled={saving} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700">Close</button>
      </div>
      {isOpen && <div className="space-y-4"><DisplaySettingsCard /><ChangePasswordCard onSavingChange={setSaving} /></div>}
    </dialog>
  </>;
}
