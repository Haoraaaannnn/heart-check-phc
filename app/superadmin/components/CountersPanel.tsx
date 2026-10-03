/**
 * @fileoverview Registration Counters management panel for the SuperAdmin facilities module.
 *
 * Allows administrators to add, rename, activate/deactivate, and delete
 * physical front-desk queue counter stations (e.g. Counter 1 to 5).
 *
 * @module app/superadmin/components/CountersPanel
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { FACILITIES_TEXTS } from '../facilities/constants/facilitiesTexts';
import { FACILITIES_STYLES } from '../facilities/constants/facilitiesStyles';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface Counter {
  counter_number: number;
  label: string | null;
  active: boolean;
  inUse: number;
}

/**
 * Registration counters configuration panel.
 *
 * @returns JSX element containing the counters panel.
 */
export function CountersPanel() {
  const S = FACILITIES_STYLES;
  const B = SUPERADMIN_STYLES.buttons;
  const T = FACILITIES_TEXTS.counters;

  const [counters, setCounters] = useState<Counter[]>([]);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminApi('/api/superadmin/counters');
      setCounters(data.counters || []);
      setLabels(
        Object.fromEntries(
          (data.counters || []).map((c: Counter) => [c.counter_number, c.label ?? ''])
        )
      );
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load counter stations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
      await load();
    } catch (e: any) {
      setError(e.message || 'Action failed.');
    }
  };

  const add = () =>
    run(async () => {
      await adminApi('/api/superadmin/counters', 'POST', {
        counter_number: newNumber ? Number(newNumber) : undefined,
        label: newLabel,
      });
      setNewNumber('');
      setNewLabel('');
    });

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{T.loadingText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Add Counter Station Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <i className="bx bx-plus-circle text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <span>{T.addCounterTitle}</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="number"
            min="1"
            step="1"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder={T.counterNumberPlaceholder}
            className="w-full sm:w-28 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={T.counterLabelPlaceholder}
            className="w-full flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={add}
            className={`${B.primary} w-full sm:w-auto shrink-0 justify-center`}
          >
            <i className="bx bx-plus" aria-hidden="true" />
            <span>{T.addCounterButton}</span>
          </button>
        </div>
      </div>

      {/* List of Registered Counters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {counters.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {T.emptyState}
          </div>
        ) : (
          counters.map((c) => (
            <div
              key={c.counter_number}
              className="flex items-center gap-3 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
            >
              <span className={S.counterBadge}>
                {c.counter_number}
              </span>

              <input
                type="text"
                value={labels[c.counter_number] ?? ''}
                onChange={(e) =>
                  setLabels((l) => ({ ...l, [c.counter_number]: e.target.value }))
                }
                onBlur={() => {
                  if ((labels[c.counter_number] ?? '') !== (c.label ?? '')) {
                    run(() =>
                      adminApi('/api/superadmin/counters', 'PUT', {
                        counter_number: c.counter_number,
                        label: labels[c.counter_number],
                        active: c.active,
                      })
                    );
                  }
                }}
                placeholder={`${T.counterPrefix} ${c.counter_number}`}
                className="flex-1 px-3 py-1.5 text-sm bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-rose-500 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
              />

              {c.inUse > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                  {c.inUse} {T.inUseBadge}
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  run(() =>
                    adminApi('/api/superadmin/counters', 'PUT', {
                      counter_number: c.counter_number,
                      label: labels[c.counter_number],
                      active: !c.active,
                    })
                  )
                }
                className={`text-xs font-semibold px-3 py-1 rounded-full transition cursor-pointer shrink-0 ${
                  c.active
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {c.active ? T.activeStatus : T.inactiveStatus}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(T.deleteConfirm)) {
                    run(() =>
                      adminApi('/api/superadmin/counters', 'DELETE', {
                        counter_number: c.counter_number,
                      })
                    );
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                title="Delete counter station"
              >
                <i className="bx bx-trash text-lg" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}