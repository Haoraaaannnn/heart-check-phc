/** @fileoverview Compact ticket actions in a native popover above clipped queue cards. */
'use client';
import { useId, useRef, useState } from 'react';
import { staffPageScale } from '@/lib/displayPreferences';

/**
 * Keeps secondary ticket actions out of the main queue controls.
 * @param props - Ticket label and the history action supplied by its owning component.
 * @returns An accessible popover with native outside-click and Escape dismissal.
 */
export function PatientTicketMenu({ ticket, onHistory }: { ticket: string; onHistory: () => void }) {
  const menuId = useId();
  const menu = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  return <span className="inline-flex shrink-0 align-middle" onPointerDown={event => event.stopPropagation()}
    onMouseDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
    onKeyDown={event => event.stopPropagation()}>
    <button type="button" popoverTarget={menuId} aria-label={`More actions for ${ticket}`} title="More actions"
      onClick={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const scale = staffPageScale();
        setPosition({ left: Math.max(8, Math.min(bounds.right / scale - 160, window.innerWidth / scale - 168)),
          top: bounds.bottom + 56 * scale > window.innerHeight ? Math.max(8, bounds.top / scale - 52) : bounds.bottom / scale + 4 });
      }}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#cc3535] dark:text-[#b8b8b8] dark:hover:bg-[#303030]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
      </svg>
    </button>
    <span ref={menu} id={menuId} popover="auto" style={{ position: 'fixed', margin: 0, ...position }}
      className="w-40 rounded-lg border border-slate-200 bg-white p-1 text-slate-700 shadow-lg dark:border-[#414141] dark:bg-[#242424] dark:text-[#dedede]">
      <button type="button" onClick={() => { menu.current?.hidePopover(); onHistory(); }}
        className="block w-full rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#cc3535] dark:hover:bg-[#303030]">View history</button>
    </span>
  </span>;
}
