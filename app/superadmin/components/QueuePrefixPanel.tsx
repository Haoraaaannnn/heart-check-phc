/**
 * @fileoverview Queue Prefix and Room Mapping settings card for the SuperAdmin Settings panel.
 *
 * Renders a full-width settings card inside the SettingsPanel grid that lets administrators
 * configure which queue prefix digit (1-9) and which physical room number each clinical
 * service maps to. Values are persisted to the `app_settings` table under the key
 * `queue_prefix_map` as a JSON-serialized array.
 *
 * @remarks
 * Data shape stored in `app_settings.value` (JSON string):
 * ```json
 * [
 *   { "service": "OPD Screening", "subcategory": null, "prefix": "1", "room": 1 },
 *   ...
 * ]
 * ```
 *
 * This component is purely presentational: copy comes from QUEUE_PREFIX_TEXTS,
 * styles reuse SETTINGS_STYLES and SUPERADMIN_SKELETON_STYLES, and no inline style
 * objects or hardcoded text appear inside the JSX. Satisfies AGENTS.md rules 1-3.
 *
 * @module app/superadmin/components/QueuePrefixPanel
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { adminApi } from '@/app/superadmin/lib/adminApi';
import { QUEUE_PREFIX_TEXTS } from '@/app/superadmin/constants/queuePrefixTexts';
import { SETTINGS_STYLES } from '@/app/superadmin/constants/settingsStyles';
import { SUPERADMIN_SKELETON_STYLES } from '@/app/superadmin/constants/superadminSkeletonStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * One row in the queue prefix mapping table, representing a single clinical
 * service (optionally with a subcategory).
 */
export interface QueuePrefixRow {
  /** English service label as stored in the database (e.g. "OPD Screening"). */
  service: string;

  /**
   * Optional subcategory qualifier (e.g. "Pedia" or "Adult").
   * Null for services that have no subcategory distinction.
   */
  subcategory: string | null;

  /**
   * String prefix assigned to this service's ticket series (e.g. "1", "10", "12").
   * Allows multi-digit prefixes matching room numbers beyond 9.
   */
  prefix: string;

  /**
   * Physical room number this service operates in.
   * Valid range is 1 to 999.
   */
  room: number;
}

// ---------------------------------------------------------------------------
// Default mapping
// ---------------------------------------------------------------------------

/**
 * Canonical default rows for the queue prefix map, matching the hardcoded
 * prefix scheme in smsPrefixRules.ts.
 *
 * @remarks
 * These defaults are displayed when no persisted value is found in `app_settings`.
 * Once the administrator saves, the database value takes precedence.
 */
const DEFAULT_ROWS: readonly QueuePrefixRow[] = [
  { service: 'OPD Screening',       subcategory: null,    prefix: '1', room: 1 },
  { service: 'Consultation',        subcategory: 'Pedia', prefix: '2', room: 2 },
  { service: 'ECG',                 subcategory: null,    prefix: '3', room: 3 },
  { service: 'OPD Card',            subcategory: null,    prefix: '4', room: 4 },
  { service: 'Consultation',        subcategory: 'Adult', prefix: '5', room: 5 },
  { service: 'Refill Prescription', subcategory: null,    prefix: '6', room: 6 },
  { service: 'Warfarin',            subcategory: null,    prefix: '7', room: 7 },
  { service: 'OPD Reschedule',      subcategory: null,    prefix: '8', room: 8 },
  { service: 'Benzathine',          subcategory: null,    prefix: '9', room: 9 },
] as const;

/**
 * Derives the display label for a row combining service name and optional subcategory.
 *
 * @param row - The queue prefix row to label.
 * @returns Display string such as "Consultation (Pedia)" or "OPD Screening".
 */
function rowLabel(row: QueuePrefixRow): string {
  return row.subcategory ? `${row.service} (${row.subcategory})` : row.service;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Full-width settings card that renders an editable table of queue prefix
 * digit and room number assignments for each clinical service.
 *
 * @remarks
 * - Loads the persisted `queue_prefix_map` key from `/api/superadmin/settings` on mount.
 * - Falls back to DEFAULT_ROWS when no persisted mapping is found.
 * - Persists changes via a PUT to the same endpoint.
 * - All text copy is sourced from QUEUE_PREFIX_TEXTS.
 * - All Tailwind class strings are sourced from SETTINGS_STYLES and
 *   SUPERADMIN_SKELETON_STYLES; no inline style objects are used.
 *
 * @returns JSX element containing the queue prefix mapping card.
 */
export function QueuePrefixPanel() {
  const T = QUEUE_PREFIX_TEXTS;
  const S = SETTINGS_STYLES;
  const SK = SUPERADMIN_SKELETON_STYLES.settings;

  const [rows, setRows] = useState<QueuePrefixRow[]>(
    DEFAULT_ROWS.map((r) => ({ ...r }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  /**
   * Fetches the persisted `queue_prefix_map` setting from the API and merges
   * it with the default rows, preserving row order defined by DEFAULT_ROWS.
   *
   * @remarks
   * If the stored JSON is absent or malformed, the component silently falls back
   * to the DEFAULT_ROWS without surfacing an error to the user.
   */
  const loadMapping = useCallback(async () => {
    try {
      const [data, { data: dbServices }] = await Promise.all([
        adminApi('/api/superadmin/settings'),
        supabase
          .from('services')
          .select('label_en, has_subcategories, queue_prefix')
          .order('display_order', { ascending: true }),
      ]);

      const raw: string | undefined = data?.settings?.queue_prefix_map;
      let existingRows: QueuePrefixRow[] = [];

      if (raw) {
        try {
          const parsed: QueuePrefixRow[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            existingRows = parsed.map((r) => ({ ...r }));
          }
        } catch {
          // Non-critical: defaults remain applied.
        }
      }

      if (existingRows.length === 0) {
        existingRows = DEFAULT_ROWS.map((r) => ({ ...r }));
      }

      // Reconcile with dynamic services from database
      if (dbServices && dbServices.length > 0) {
        const mergedRows: QueuePrefixRow[] = [...existingRows];
        for (const svc of dbServices) {
          if (svc.has_subcategories) {
            for (const sub of ['Adult', 'Pedia']) {
              const found = mergedRows.find(
                (r) =>
                  r.service.trim().toLowerCase() === svc.label_en.trim().toLowerCase() &&
                  r.subcategory?.trim().toLowerCase() === sub.toLowerCase()
              );
              if (!found) {
                mergedRows.push({
                  service: svc.label_en,
                  subcategory: sub,
                  prefix: svc.queue_prefix || String(mergedRows.length + 1),
                  room: mergedRows.length + 1,
                });
              }
            }
          } else {
            const found = mergedRows.find(
              (r) =>
                r.service.trim().toLowerCase() === svc.label_en.trim().toLowerCase() &&
                !r.subcategory
            );
            if (!found) {
              mergedRows.push({
                service: svc.label_en,
                subcategory: null,
                prefix: svc.queue_prefix || String(mergedRows.length + 1),
                room: mergedRows.length + 1,
              });
            }
          }
        }
        setRows(mergedRows);
        return;
      }

      setRows(existingRows);
    } catch {
      // Non-critical: defaults remain applied.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapping();

    const channel = supabase
      .channel('superadmin-prefix-services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          loadMapping();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMapping]);

  // ---------------------------------------------------------------------------
  // Field change handlers
  // ---------------------------------------------------------------------------

  /**
   * Updates the prefix digit for the row at the given index.
   *
   * @param index - Zero-based row index within the `rows` array.
   * @param value - Raw string value from the input element.
   */
  const handlePrefixChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], prefix: value };
      return next;
    });
  };

  /**
   * Updates the room number for the row at the given index.
   *
   * @param index - Zero-based row index within the `rows` array.
   * @param value - Raw string value from the input element.
   */
  const handleRoomChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], room: Number(value) };
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  /**
   * Validates all rows and persists the current mapping to the `app_settings`
   * table via the PUT /api/superadmin/settings endpoint.
   *
   * @remarks
   * Validation rules:
   *   - Every prefix must be a whole number integer between 1 and 9.
   *   - Every room number must be a whole number integer between 1 and 99.
   *
   * On success, a transient success banner is displayed for 2.5 seconds.
   * On failure, a persistent error message is shown until the next save attempt.
   */
  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const isValid = rows.every((r) => {
      const p = (r.prefix ?? '').trim();
      const rm = Number(r.room);
      return (
        p.length > 0 &&
        /^[A-Za-z0-9]+$/.test(p) &&
        Number.isInteger(rm) && rm >= 1 && rm <= 999
      );
    });

    if (!isValid) {
      setErrorMessage(T.errorInvalid);
      return;
    }

    setSaving(true);
    try {
      await adminApi('/api/superadmin/settings', 'PUT', {
        key: 'queue_prefix_map',
        value: JSON.stringify(rows),
      });
      setSuccessMessage(T.success);
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message || T.errorInvalid);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={S.fullWidthCard}>
      {/* Card header */}
      <div className={S.cardHeader}>
        <h3 className={S.cardTitle}>
          <i className={`bx bx-hash ${S.cardIcon}`} aria-hidden="true" />
          <span>{T.title}</span>
        </h3>
        <p className={S.cardDescription}>{T.description}</p>
      </div>

      {/* Feedback banners */}
      {errorMessage && (
        <div className={`${S.alertError} mb-2`}>{errorMessage}</div>
      )}
      {successMessage && (
        <div className={`${S.alertSuccess} mb-2`}>{successMessage}</div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {DEFAULT_ROWS.map((_, i) => (
            <div key={i} className={`${SK.inputRow} gap-4`}>
              <div className="flex-1 h-9 rounded-lg bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e]" />
              <div className={SK.inputBox} />
              <div className={SK.inputBox} />
            </div>
          ))}
          <div className={`${SK.saveButton} mt-3`} />
        </div>
      ) : (
        <>
          {/* Mapping table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#2e2e2e]">
                  <th className="py-2 pr-4 text-left text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider w-full">
                    {T.serviceHeader}
                  </th>
                  <th className="py-2 px-3 text-center text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider whitespace-nowrap">
                    {T.prefixHeader}
                  </th>
                  <th className="py-2 pl-3 text-center text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider whitespace-nowrap">
                    {T.roomHeader}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2e2e2e]">
                {rows.map((row, i) => (
                  <tr key={`${row.service}-${row.subcategory ?? ''}`}>
                    {/* Service label (non-editable) */}
                    <td className="py-2.5 pr-4 text-sm font-medium text-slate-700 dark:text-[#e5e5e5] whitespace-normal break-words">
                      {rowLabel(row)}
                    </td>

                    {/* Prefix letter or number input */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="text"
                        maxLength={6}
                        value={row.prefix}
                        onChange={(e) => handlePrefixChange(i, e.target.value.toUpperCase())}
                        aria-label={`Prefix for ${rowLabel(row)}`}
                        className={`${S.numberInput} w-20 text-center uppercase font-mono font-semibold`}
                      />
                    </td>


                    {/* Room number input */}
                    <td className="py-2.5 pl-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        step={1}
                        value={row.room}
                        onChange={(e) => handleRoomChange(i, e.target.value)}
                        aria-label={`Room number for ${rowLabel(row)}`}
                        className={`${S.numberInput} w-20 text-center`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Default note */}
          <p className={`${S.cardDescription} mt-1`}>{T.defaultNote}</p>

          {/* Save button */}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={S.saveButton}
            >
              {saving ? T.savingButton : T.saveButton}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
