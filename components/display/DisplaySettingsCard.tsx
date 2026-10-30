/** @fileoverview Immediate, reversible text-size and page-zoom controls for staff workstations. */
'use client';
import { DEFAULT_DISPLAY_PREFERENCES, FONT_PERCENT_OPTIONS, ZOOM_PERCENT_OPTIONS } from '@/lib/displayPreferences';
import { useDisplayPreferences } from './DisplayPreferencesProvider';

/** @returns Accessible display choices with browser-local save feedback and a one-click reset. */
export function DisplaySettingsCard() {
  const { preferences, storageAvailable, update } = useDisplayPreferences();
  const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
  return <section aria-label="Display settings" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
    <h3 className="text-base font-bold">Display settings</h3>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Adjust staff pages on this browser. Kiosk and monitor screens keep their usual sizes.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-semibold">Text size
        <select value={preferences.fontPercent} onChange={event => update({ ...preferences, fontPercent: Number(event.target.value) })} className={inputClass}>
          {FONT_PERCENT_OPTIONS.map(percent => <option key={percent} value={percent}>{percent}%{percent === 100 ? ' (Default)' : ''}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Page zoom
        <select value={preferences.zoomPercent} onChange={event => update({ ...preferences, zoomPercent: Number(event.target.value) })} className={inputClass}>
          {ZOOM_PERCENT_OPTIONS.map(percent => <option key={percent} value={percent}>{percent}%{percent === 100 ? ' (Default)' : ''}</option>)}
        </select>
      </label>
    </div>
    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Lower page zoom fits more on screen. Higher zoom enlarges text and controls.</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-xs text-slate-500 dark:text-slate-400">{storageAvailable ? 'Changes apply immediately and stay saved in this browser.' : 'Changes apply now. Browser storage is unavailable, so they may reset after refresh.'}</p>
      <button type="button" onClick={() => update(DEFAULT_DISPLAY_PREFERENCES)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600">Reset to default</button>
    </div>
  </section>;
}
