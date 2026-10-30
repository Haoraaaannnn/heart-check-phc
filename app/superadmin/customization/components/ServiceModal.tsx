/**
 * @fileoverview Modal dialog component for Creating and Editing Kiosk Services in SuperAdmin.
 *
 * Configures touch-screen service cards, bilingual English and Filipino labels and descriptions,
 * patient cohort eligibility, Boxicons, queue number prefix and padding, and capability checklists.
 *
 * @module app/superadmin/customization/components/ServiceModal
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Service } from '@/types/Services';
import {
  AVAILABLE_SERVICE_BOXICONS,
  resolveServiceIcon,
} from '@/constants/icons';
import { CUSTOMIZATION_TEXTS } from '@/app/superadmin/customization/constants/customizationTexts';
import { CUSTOMIZATION_STYLES } from '@/app/superadmin/customization/constants/customizationStyles';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';
import { invalidateFacilityMetadataCache } from '@/lib/cache/facilityMetadataCache';

type PatientType = 'new' | 'old' | 'both';

const EMPTY_FORM: Omit<Service, 'id'> = {
  label_en: '',
  label_fil: '',
  icon_src: '',
  display_order: 0,
  description_en: '',
  description_fil: '',
  patient_type: 'both',
  queue_prefix: '',
  queue_pad_length: 3,
  requires_registration: false,
  has_subcategories: false,
  requires_cubicle: false,
  requires_nurse: false,
  show_on_monitor: true,
  auto_assign: false,
  monitor_layout: 'cubicle',
};

export interface ServiceModalProps {
  /** Whether the modal dialog is currently visible. */
  isOpen: boolean;
  /** Currently editing service ID or 'new' for creation mode. */
  editingId: number | 'new' | null;
  /** Service instance to edit, or null when creating. */
  service: Service | null;
  /** Next display order index for new services. */
  nextDisplayOrder: number;
  /** Callback to close the modal dialog without saving. */
  onClose: () => void;
  /** Callback triggered after successfully creating or updating a service. */
  onSaved: () => void;
}

/**
 * Modal dialog for creating and modifying kiosk outpatient services.
 */
export function ServiceModal({
  isOpen,
  editingId,
  service,
  nextDisplayOrder,
  onClose,
  onSaved,
}: ServiceModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const S = CUSTOMIZATION_STYLES;
  const M = SUPERADMIN_STYLES.modal;
  const B = SUPERADMIN_STYLES.buttons;
  const T = CUSTOMIZATION_TEXTS;

  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY_FORM);
  const [iconQuery, setIconQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allIconNames = useMemo(() => AVAILABLE_SERVICE_BOXICONS, []);

  const filteredIconNames = useMemo(() => {
    if (!iconQuery) return allIconNames.slice(0, 20);
    return allIconNames
      .filter((name) => name.toLowerCase().includes(iconQuery.toLowerCase()))
      .slice(0, 30);
  }, [iconQuery, allIconNames]);

  // Synchronize form values on open/edit
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      return;
    }

    if (editingId === 'new' || !service) {
      setForm({
        ...EMPTY_FORM,
        display_order: nextDisplayOrder,
      });
      setIconQuery('');
    } else {
      const { id: _, ...rest } = service;
      setForm({
        ...rest,
        queue_prefix: rest.queue_prefix ?? '',
        queue_pad_length: rest.queue_pad_length ?? 3,
        requires_registration: Boolean(rest.requires_registration),
        has_subcategories: Boolean(rest.has_subcategories),
        requires_cubicle: Boolean(rest.requires_cubicle),
        requires_nurse: Boolean(rest.requires_nurse),
        show_on_monitor: rest.show_on_monitor !== false,
        auto_assign: Boolean(rest.auto_assign),
        monitor_layout: rest.monitor_layout || 'cubicle',
      });
      setIconQuery(service.icon_src || '');
    }
    setError(null);
  }, [isOpen, editingId, service, nextDisplayOrder]);

  /**
   * Cascades service renaming across cubicles, staff assignments, active patients, and settings.
   */
  const cascadeServiceRename = useCallback(
    async (oldName: string, newName: string) => {
      try {
        await Promise.all([
          supabase.from('cubicle').update({ category: newName }).eq('category', oldName),
          supabase.from('user_services').update({ service: newName }).eq('service', oldName),
          supabase.from('user_rooms').update({ service: newName }).eq('service', oldName),
          supabase
            .from('patients')
            .update({ service: newName })
            .eq('service', oldName)
            .eq('is_historical', false),
        ]);

        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'queue_prefix_map')
          .maybeSingle();

        if (settingData?.value) {
          const parsed = JSON.parse(settingData.value);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((item: Record<string, unknown>) =>
              item.service === oldName ? { ...item, service: newName } : item
            );
            await supabase
              .from('app_settings')
              .update({ value: JSON.stringify(updated) })
              .eq('key', 'queue_prefix_map');
          }
        }
      } catch (cascadeErr) {
        console.warn('[SERVICE RENAME CASCADE ERROR]', cascadeErr);
      }
    },
    [supabase]
  );

  /**
   * Syncs newly created service into app_settings queue_prefix_map.
   */
  const syncNewServicePrefixMap = useCallback(
    async (inserted: { label_en: string; has_subcategories: boolean; queue_prefix: string | null }) => {
      try {
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'queue_prefix_map')
          .maybeSingle();

        if (!settingData?.value) return;
        const parsed = JSON.parse(settingData.value);
        if (!Array.isArray(parsed)) return;

        const newRows = [...parsed];
        const svcName = inserted.label_en;
        const subcategories = inserted.has_subcategories ? ['Adult', 'Pedia'] : [null];

        for (const sub of subcategories) {
          const exists = newRows.some(
            (r: Record<string, unknown>) => r.service === svcName && r.subcategory === sub
          );
          if (!exists) {
            newRows.push({
              service: svcName,
              subcategory: sub,
              prefix: inserted.queue_prefix || String(newRows.length + 1),
              room: newRows.length + 1,
            });
          }
        }

        await supabase
          .from('app_settings')
          .update({ value: JSON.stringify(newRows) })
          .eq('key', 'queue_prefix_map');
      } catch (err) {
        console.warn('[PREFIX MAP SYNC ERROR]', err);
      }
    },
    [supabase]
  );

  /**
   * Syncs updated service prefix into app_settings queue_prefix_map.
   */
  const syncServicePrefixUpdate = useCallback(
    async (serviceName: string, newPrefix: string | null) => {
      try {
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'queue_prefix_map')
          .maybeSingle();

        if (!settingData?.value) return;
        const parsed = JSON.parse(settingData.value);
        if (!Array.isArray(parsed)) return;

        let changed = false;
        const updated = parsed.map((item: Record<string, unknown>) => {
          if (item.service === serviceName && newPrefix) {
            changed = true;
            return { ...item, prefix: newPrefix };
          }
          return item;
        });

        if (changed) {
          await supabase
            .from('app_settings')
            .update({ value: JSON.stringify(updated) })
            .eq('key', 'queue_prefix_map');
        }
      } catch (err) {
        console.warn('[PREFIX MAP UPDATE ERROR]', err);
      }
    },
    [supabase]
  );

  const handleSave = async () => {
    if (!form.label_en.trim() || !form.label_fil.trim()) {
      setError(T.validation.labelsRequired);
      return;
    }
    if (!form.icon_src.trim()) {
      setError(T.validation.iconRequired);
      return;
    }

    const padLength = Number(form.queue_pad_length ?? 3);
    if (!Number.isInteger(padLength) || padLength < 1 || padLength > 6) {
      setError(T.validation.padLengthInvalid);
      return;
    }

    const cleanPrefix = (form.queue_prefix ?? '').trim().toUpperCase();
    if (cleanPrefix && !/^[A-Za-z0-9]+$/.test(cleanPrefix)) {
      setError(T.validation.prefixInvalid);
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      queue_prefix: cleanPrefix || null,
      queue_pad_length: padLength,
    };

    if (editingId === 'new') {
      const { data: insertedData, error: insertErr } = await supabase
        .from('services')
        .insert([payload])
        .select('label_en, has_subcategories, queue_prefix')
        .single();

      if (insertErr) {
        setError(insertErr.message);
        setSaving(false);
        return;
      }

      if (insertedData) {
        await syncNewServicePrefixMap(insertedData);
      }
    } else if (editingId !== null && service) {
      const { error: updateErr } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingId);

      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }

      if (service.label_en !== payload.label_en) {
        await cascadeServiceRename(service.label_en, payload.label_en);
      }
      if (service.queue_prefix !== payload.queue_prefix) {
        await syncServicePrefixUpdate(payload.label_en, payload.queue_prefix);
      }
    }

    invalidateFacilityMetadataCache('services');
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={M.backdrop} role="dialog" aria-modal="true">
      <div className={`${M.panel} max-w-4xl`}>
        {/* Modal Header */}
        <div className={M.header}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-xl shrink-0">
              <i className="bx bx-slider-alt" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">
                {editingId === 'new' ? T.form.newTitle : T.form.editTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
                Configure outpatient touchscreen display properties and patient triage flow.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={B.ghost}
            aria-label="Close service modal"
          >
            <i className="bx bx-x text-xl" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={M.body}>
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <i className="bx bx-error-circle text-lg shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Bilingual Labels */}
          <div className={S.grid2}>
            <div>
              <label className={S.label}>{T.form.labelEn}</label>
              <input
                type="text"
                value={form.label_en}
                onChange={(e) => setForm({ ...form, label_en: e.target.value })}
                placeholder={T.form.labelEnPlaceholder}
                className={S.input}
                required
              />
            </div>
            <div>
              <label className={S.label}>{T.form.labelFil}</label>
              <input
                type="text"
                value={form.label_fil}
                onChange={(e) => setForm({ ...form, label_fil: e.target.value })}
                placeholder={T.form.labelFilPlaceholder}
                className={S.input}
                required
              />
            </div>
          </div>

          {/* Bilingual Descriptions */}
          <div className={S.grid2}>
            <div>
              <label className={S.label}>{T.form.descEn}</label>
              <textarea
                value={form.description_en ?? ''}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                placeholder={T.form.descEnPlaceholder}
                className={S.textarea}
                rows={2}
              />
            </div>
            <div>
              <label className={S.label}>{T.form.descFil}</label>
              <textarea
                value={form.description_fil ?? ''}
                onChange={(e) => setForm({ ...form, description_fil: e.target.value })}
                placeholder={T.form.descFilPlaceholder}
                className={S.textarea}
                rows={2}
              />
            </div>
          </div>

          {/* Cohort and Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={S.label}>{T.form.patientType}</label>
              <select
                value={form.patient_type}
                onChange={(e) =>
                  setForm({ ...form, patient_type: e.target.value as PatientType })
                }
                className={S.select}
              >
                <option value="both" className={S.selectOption}>
                  {T.form.patientTypeBoth}
                </option>
                <option value="new" className={S.selectOption}>
                  {T.form.patientTypeNew}
                </option>
                <option value="old" className={S.selectOption}>
                  {T.form.patientTypeOld}
                </option>
              </select>
            </div>
            <div>
              <label className={S.label}>{T.form.displayOrder}</label>
              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(e) =>
                  setForm({ ...form, display_order: Number(e.target.value) })
                }
                className={S.input}
              />
            </div>
          </div>

          {/* Queue Prefix & Ticket Config */}
          <div className={S.sectionBox}>
            <div className={S.sectionHeader}>
              <i className="bx bx-receipt text-base text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <span>{T.form.queueConfigTitle}</span>
            </div>
            <p className={S.sectionSubtitle}>{T.form.queueConfigSubtitle}</p>

            <div className={S.grid2}>
              <div>
                <label className={S.label}>{T.form.queuePrefixLabel}</label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.queue_prefix ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, queue_prefix: e.target.value.toUpperCase() })
                  }
                  placeholder={T.form.queuePrefixPlaceholder}
                  className={S.input}
                />
                <p className={S.helpText}>{T.form.queuePrefixHelp}</p>
              </div>
              <div>
                <label className={S.label}>{T.form.queuePadLengthLabel}</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={form.queue_pad_length ?? 3}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      queue_pad_length: Math.max(1, Math.min(6, Number(e.target.value) || 1)),
                    })
                  }
                  placeholder={T.form.queuePadLengthPlaceholder}
                  className={S.input}
                />
                <p className={S.helpText}>{T.form.queuePadLengthHelp}</p>
              </div>
            </div>

            {/* Live Ticket Preview */}
            <div className={S.previewCard}>
              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-[#e5e5e5]">
                  {T.form.previewLabel}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">
                  {T.form.previewExplanation}
                </span>
              </div>
              <span className={S.ticketBadge}>
                {`${(form.queue_prefix || '').trim().toUpperCase() || '?'}${String(1).padStart(
                  form.queue_pad_length ?? 3,
                  '0'
                )}`}
              </span>
            </div>
          </div>

          {/* Workflow Routing Capabilities Checklist */}
          <div className={S.sectionBox}>
            <div className={S.sectionHeader}>
              <i className="bx bx-check-shield text-base text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <span>{T.form.workflowSectionTitle}</span>
            </div>
            <p className={S.sectionSubtitle}>{T.form.workflowSectionSubtitle}</p>

            <div className={S.checklistGrid}>
              <label
                className={`${S.checkCard} ${
                  form.requires_registration ? S.checkCardActive : S.checkCardInactive
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.requires_registration)}
                  onChange={(e) =>
                    setForm({ ...form, requires_registration: e.target.checked })
                  }
                  className={S.checkbox}
                />
                <div>
                  <span className={S.checkTitle}>{T.form.requiresRegistrationLabel}</span>
                  <span className={S.checkDescription}>{T.form.requiresRegistrationDesc}</span>
                </div>
              </label>

              <label
                className={`${S.checkCard} ${
                  form.has_subcategories ? S.checkCardActive : S.checkCardInactive
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.has_subcategories)}
                  onChange={(e) =>
                    setForm({ ...form, has_subcategories: e.target.checked })
                  }
                  className={S.checkbox}
                />
                <div>
                  <span className={S.checkTitle}>{T.form.hasSubcategoriesLabel}</span>
                  <span className={S.checkDescription}>{T.form.hasSubcategoriesDesc}</span>
                </div>
              </label>

              <label
                className={`${S.checkCard} ${
                  form.requires_cubicle ? S.checkCardActive : S.checkCardInactive
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.requires_cubicle)}
                  onChange={(e) =>
                    setForm({ ...form, requires_cubicle: e.target.checked })
                  }
                  className={S.checkbox}
                />
                <div>
                  <span className={S.checkTitle}>{T.form.requiresCubicleLabel}</span>
                  <span className={S.checkDescription}>{T.form.requiresCubicleDesc}</span>
                </div>
              </label>

              <label
                className={`${S.checkCard} ${
                  form.requires_nurse ? S.checkCardActive : S.checkCardInactive
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.requires_nurse)}
                  onChange={(e) =>
                    setForm({ ...form, requires_nurse: e.target.checked })
                  }
                  className={S.checkbox}
                />
                <div>
                  <span className={S.checkTitle}>{T.form.requiresNurseLabel}</span>
                  <span className={S.checkDescription}>{T.form.requiresNurseDesc}</span>
                </div>
              </label>

              <label
                className={`${S.checkCard} ${
                  form.show_on_monitor ? S.checkCardActive : S.checkCardInactive
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.show_on_monitor !== false}
                  onChange={(e) =>
                    setForm({ ...form, show_on_monitor: e.target.checked })
                  }
                  className={S.checkbox}
                />
                <div>
                  <span className={S.checkTitle}>{T.form.showOnMonitorLabel}</span>
                  <span className={S.checkDescription}>{T.form.showOnMonitorDesc}</span>
                </div>
              </label>

              <label
                className={`${S.checkCard} ${
                  form.auto_assign ? S.checkCardActive : S.checkCardInactive
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.auto_assign)}
                  onChange={(e) => setForm({ ...form, auto_assign: e.target.checked })}
                  className={S.checkbox}
                />
                <div>
                  <span className={S.checkTitle}>{T.form.autoAssignLabel}</span>
                  <span className={S.checkDescription}>{T.form.autoAssignDesc}</span>
                </div>
              </label>
            </div>

            {/* Monitor Layout Style */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#2e2e2e]">
              <label className={S.label}>{T.form.monitorLayoutLabel}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, monitor_layout: 'cubicle' })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    (form.monitor_layout || 'cubicle') === 'cubicle'
                      ? 'border-rose-400 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-[#a3a3a3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className="bx bx-window-alt text-base" aria-hidden="true" />
                    <span className="text-xs font-bold">{T.form.monitorLayoutCubicle}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, monitor_layout: 'table' })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    form.monitor_layout === 'table'
                      ? 'border-rose-400 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-[#a3a3a3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className="bx bx-grid-alt text-base" aria-hidden="true" />
                    <span className="text-xs font-bold">{T.form.monitorLayoutTable}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Boxicon Picker */}
          <div>
            <label className={S.label}>{T.form.iconLabel}</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={iconQuery}
                onChange={(e) => {
                  setIconQuery(e.target.value);
                  setForm({ ...form, icon_src: e.target.value });
                }}
                placeholder={T.form.iconPlaceholder}
                className={S.input}
              />
              {form.icon_src && (
                <div className={S.iconPreviewBox}>
                  <i
                    className={`bx ${resolveServiceIcon(form.icon_src)} text-2xl text-rose-600 dark:text-rose-400`}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-[#a3a3a3]">
                    {form.icon_src}
                  </span>
                </div>
              )}
            </div>

            {iconQuery && filteredIconNames.length > 0 && (
              <div className={S.iconDropdown}>
                {filteredIconNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setIconQuery(name);
                      setForm({ ...form, icon_src: name });
                    }}
                    className={S.iconDropdownItem}
                  >
                    <i className={`bx ${name} text-lg text-rose-600`} aria-hidden="true" />
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={M.footer}>
          <button
            type="button"
            onClick={onClose}
            className={B.secondary}
            disabled={saving}
          >
            {T.form.cancelButton}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={B.primary}
          >
            {saving ? T.form.savingButton : T.form.saveButton}
          </button>
        </div>
      </div>
    </div>
  );
}
