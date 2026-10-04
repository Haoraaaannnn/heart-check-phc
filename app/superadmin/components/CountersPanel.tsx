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
      <div className={S.loadingWrapper}>
        <div className={S.loadingSpinner} />
        <p className={S.loadingText}>{T.loadingText}</p>
      </div>
    );
  }

  return (
    <div className={S.countersContainer}>
      {error && (
        <div className={S.errorBanner}>
          {error}
        </div>
      )}

      {/* Add Counter Station Card */}
      <div className={S.counterAddCard}>
        <h3 className={S.counterAddTitle}>
          <i className="bx bx-plus-circle text-[#a8071a] dark:text-[#f87171]" aria-hidden="true" />
          <span>{T.addCounterTitle}</span>
        </h3>
        <div className={S.counterAddForm}>
          <input
            type="number"
            min="1"
            step="1"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder={T.counterNumberPlaceholder}
            className={S.counterNumInput}
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={T.counterLabelPlaceholder}
            className={S.counterLabelInput}
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
      <div className={S.countersListCard}>
        {counters.length === 0 ? (
          <div className={S.emptyCard}>
            <p className={S.emptyText}>{T.emptyState}</p>
          </div>
        ) : (
          counters.map((c) => (
            <div
              key={c.counter_number}
              className={S.counterItem}
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
                className={S.counterInlineInput}
              />

              {c.inUse > 0 && (
                <span className={S.counterInUseBadge}>
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
                className={`${S.counterStatusBtn} ${
                  c.active ? S.counterStatusActive : S.counterStatusInactive
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
                className={S.counterDeleteBtn}
                title={T.deleteCounterStationAria}
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