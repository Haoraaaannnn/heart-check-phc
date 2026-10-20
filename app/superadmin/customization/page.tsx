/**
 * @fileoverview Kiosk Customization and Services management page for SuperAdmin.
 *
 * Configures touch-screen service cards, bilingual descriptions, Boxicon glyphs,
 * patient cohort eligibility, and sequence ordering.
 *
 * @module app/superadmin/customization/page
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Service } from '@/types/Services';
import {
  AVAILABLE_SERVICE_BOXICONS,
  resolveServiceIcon,
} from '@/constants/icons';
import { useRequireAuth } from '@/app/superadmin/hooks/useRequireAuth';
import { useIdleTimeout } from '@/app/superadmin/hooks/useIdleTimeout';
import { SuperAdminPageSkeleton } from '@/app/superadmin/components/SuperAdminPageSkeleton';
import { CUSTOMIZATION_TEXTS } from '@/app/superadmin/customization/constants/customizationTexts';
import { CUSTOMIZATION_STYLES } from '@/app/superadmin/customization/constants/customizationStyles';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';
import { DeleteServiceModal } from '@/app/superadmin/customization/components/DeleteServiceModal';

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

/**
 * Superadmin kiosk services management view.
 *
 * @returns JSX element containing the kiosk customization page.
 */
export default function AdminServicePage() {
  const checking = useRequireAuth();
  useIdleTimeout();

  const supabase = useMemo(() => createClient(), []);
  const S = CUSTOMIZATION_STYLES;
  const L = SUPERADMIN_STYLES.layout;
  const B = SUPERADMIN_STYLES.buttons;
  const T = CUSTOMIZATION_TEXTS;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY_FORM);
  const [iconQuery, setIconQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const allIconNames = useMemo(() => AVAILABLE_SERVICE_BOXICONS, []);

  const filteredIconNames = useMemo(() => {
    if (!iconQuery) return allIconNames.slice(0, 20);
    return allIconNames
      .filter((name) => name.toLowerCase().includes(iconQuery.toLowerCase()))
      .slice(0, 30);
  }, [iconQuery, allIconNames]);

  async function loadServices() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setServices((data as Service[]) || []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  function startCreate() {
    setEditingId('new');
    setForm({
      ...EMPTY_FORM,
      display_order: services.length
        ? Math.max(...services.map((s) => s.display_order)) + 1
        : 0,
      queue_prefix: '',
      queue_pad_length: 3,
      requires_registration: false,
      has_subcategories: false,
      requires_cubicle: false,
      requires_nurse: false,
      show_on_monitor: true,
      auto_assign: false,
      monitor_layout: 'cubicle',
    });
    setIconQuery('');
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
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
    setIconQuery(service.icon_src);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIconQuery('');
    setError(null);
  }

  async function handleSave() {
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
      const { error: insertErr } = await supabase.from('services').insert([payload]);
      if (insertErr) setError(insertErr.message);
    } else if (editingId !== null) {
      const { error: updateErr } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingId);
      if (updateErr) setError(updateErr.message);
    }

    setSaving(false);
    cancelEdit();
    loadServices();
  }

  function requestDelete(service: Service) {
    setDeleteError(null);
    setDeletingService(service);
  }

  async function handleConfirmDelete() {
    if (!deletingService) return;

    setDeleteLoading(true);
    setDeleteError(null);

    const { error: delErr } = await supabase.from('services').delete().eq('id', deletingService.id);
    if (delErr) {
      setDeleteError(delErr.message);
      setDeleteLoading(false);
    } else {
      setDeleteLoading(false);
      setDeletingService(null);
      loadServices();
    }
  }

  function handleCancelDelete() {
    if (deleteLoading) return;
    setDeletingService(null);
    setDeleteError(null);
  }

  const isEditing = editingId !== null;

  if (checking) {
    return <SuperAdminPageSkeleton />;
  }

  return (
    <div className={SUPERADMIN_STYLES.layout.page}>
      {/* Header Banner Card */}
      <div className={SUPERADMIN_STYLES.banner.root}>
        <div className={SUPERADMIN_STYLES.banner.titleSection}>
          <h1 className={SUPERADMIN_STYLES.banner.heading}>{T.header.pageTitle}</h1>
          <p className={SUPERADMIN_STYLES.banner.subheading}>{T.header.pageDescription}</p>
        </div>

        {!isEditing && (
          <button type="button" onClick={startCreate} className={B.primary}>
            <i className="bx bx-plus text-base" aria-hidden="true" />
            <span>{T.header.addServiceButton}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <i className="bx bx-error-circle text-lg shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Form Card */}
      {isEditing && (
        <div className={S.formCard}>
          <div className={S.formTitle}>
            <i className="bx bx-edit text-rose-600 dark:text-rose-400 text-xl" aria-hidden="true" />
            <span>{editingId === 'new' ? T.form.newTitle : T.form.editTitle}</span>
          </div>

          <div className="space-y-4">
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
                  onChange={(e) =>
                    setForm({ ...form, description_en: e.target.value })
                  }
                  placeholder={T.form.descEnPlaceholder}
                  className={S.textarea}
                  rows={2}
                />
              </div>
              <div>
                <label className={S.label}>{T.form.descFil}</label>
                <textarea
                  value={form.description_fil ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, description_fil: e.target.value })
                  }
                  placeholder={T.form.descFilPlaceholder}
                  className={S.textarea}
                  rows={2}
                />
              </div>
            </div>

            {/* Patient Cohort and Display Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={S.label}>{T.form.patientType}</label>
                <select
                  value={form.patient_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      patient_type: e.target.value as PatientType,
                    })
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
                    setForm({
                      ...form,
                      display_order: Number(e.target.value),
                    })
                  }
                  className={S.input}
                />
              </div>
            </div>

            {/* Print Queue Number Configuration */}
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
                <div className="flex items-center gap-2">
                  <span className={S.ticketBadge}>
                    {`${(form.queue_prefix || '').trim().toUpperCase() || '?'}${String(1).padStart(form.queue_pad_length ?? 3, '0')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Service Routing & System Capabilities Checklist */}
            <div className={S.sectionBox}>
              <div className={S.sectionHeader}>
                <i className="bx bx-check-shield text-base text-rose-600 dark:text-rose-400" aria-hidden="true" />
                <span>{T.form.workflowSectionTitle}</span>
              </div>
              <p className={S.sectionSubtitle}>{T.form.workflowSectionSubtitle}</p>

              <div className={S.checklistGrid}>
                {/* 1. Requires Registration */}
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

                {/* 2. Has Subcategories (Adult / Pedia) */}
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

                {/* 3. Requires Physical Cubicle / Doctor Selection */}
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

                {/* 4. Requires Nurse Kanban */}
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

                {/* 5. Show on Public TV Monitor */}
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

                {/* 6. Auto-Assign Transfer Queue */}
                <label
                  className={`${S.checkCard} ${
                    form.auto_assign ? S.checkCardActive : S.checkCardInactive
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.auto_assign)}
                    onChange={(e) =>
                      setForm({ ...form, auto_assign: e.target.checked })
                    }
                    className={S.checkbox}
                  />
                  <div>
                    <span className={S.checkTitle}>{T.form.autoAssignLabel}</span>
                    <span className={S.checkDescription}>{T.form.autoAssignDesc}</span>
                  </div>
                </label>
              </div>

              {/* Monitor Layout Selector */}
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

            {/* Icon Selector */}
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

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#2e2e2e]">
            <button
              type="button"
              onClick={cancelEdit}
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
      )}

      {/* Services Table */}
      <div className={S.tableContainer}>
        {loading ? (
          <div className="animate-pulse">
            <table className={S.table}>
              <thead className={S.thead}>
                <tr>
                  <th className={S.th}><div className="h-3 w-10 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                  <th className={S.th}><div className="h-3 w-28 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                  <th className={S.th}><div className="h-3 w-20 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                  <th className={S.th}><div className="h-3 w-20 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                  <th className={S.th}><div className="h-3 w-12 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                  <th className={`${S.th} text-right`}><div className="h-3 w-14 bg-slate-200 dark:bg-[#2e2e2e] rounded-md ml-auto" /></th>
                </tr>
              </thead>
              <tbody className={S.tbody}>
                {['s-1', 's-2', 's-3', 's-4', 's-5'].map((key) => (
                  <tr key={key} className={S.tr}>
                    <td className={S.td}><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#242424]" /></td>
                    <td className={S.td}>
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 bg-slate-100 dark:bg-[#242424] rounded-md" />
                        <div className="h-2.5 w-24 bg-slate-100 dark:bg-[#242424] rounded-md" />
                      </div>
                    </td>
                    <td className={S.td}><div className="h-5 w-16 bg-slate-100 dark:bg-[#242424] rounded-md" /></td>
                    <td className={S.td}><div className="h-5 w-20 bg-slate-100 dark:bg-[#242424] rounded-md" /></td>
                    <td className={S.td}><div className="h-3.5 w-8 bg-slate-100 dark:bg-[#242424] rounded-md" /></td>
                    <td className={`${S.td} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-6 w-14 bg-slate-100 dark:bg-[#242424] rounded-lg" />
                        <div className="h-6 w-14 bg-slate-100 dark:bg-[#242424] rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <table className={S.table}>
            <thead className={S.thead}>
              <tr>
                <th className={S.th}>{T.table.colIcon}</th>
                <th className={S.th}>{T.table.colLabels}</th>
                <th className={S.th}>{T.table.colPatientType}</th>
                <th className={S.th}>{T.table.colQueueTicket}</th>
                <th className={S.th}>{T.table.colCapabilities}</th>
                <th className={S.th}>{T.table.colOrder}</th>
                <th className={`${S.th} text-right`}>{T.table.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const iconClass = resolveServiceIcon(service);
                const prefixDisplay = service.queue_prefix?.trim().toUpperCase();
                const padLen = service.queue_pad_length ?? 3;
                const sampleNum = prefixDisplay
                  ? `${prefixDisplay}${String(1).padStart(padLen, '0')}`
                  : null;

                return (
                  <tr key={service.id} className={S.tr}>
                    <td className={S.td}>
                      <div className="text-[#a8071a] dark:text-[#f87171] flex items-center justify-center text-2xl shrink-0">
                        <i className={`bx ${iconClass}`} aria-hidden="true" />
                      </div>
                    </td>
                    <td className={S.td}>
                      <div className="font-semibold text-slate-900 dark:text-[#f5f5f5] whitespace-normal break-words">
                        {service.label_en}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-[#a3a3a3] italic whitespace-normal break-words">
                        {service.label_fil}
                      </div>
                    </td>
                    <td className={S.td}>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border ${
                          service.patient_type === 'both'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
                            : service.patient_type === 'new'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#242424] dark:text-[#f5f5f5] dark:border-[#2e2e2e]'
                        }`}
                      >
                        {service.patient_type}
                      </span>
                    </td>
                    <td className={S.td}>
                      {sampleNum ? (
                        <div>
                          <span className={S.tableTicketBadge}>
                            <i className="bx bx-receipt text-xs" aria-hidden="true" />
                            <span>{sampleNum}</span>
                          </span>
                          <div className="text-[10px] text-slate-400 dark:text-[#737373] mt-0.5 font-mono">
                            {prefixDisplay} + {padLen}d
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-[#737373] italic">
                          {T.table.noPrefixFallback}
                        </span>
                      )}
                    </td>
                    <td className={S.td}>
                      <div className={S.badgeContainer}>
                        {service.requires_registration && (
                          <span className={S.badgeRegistration}>
                            <i className="bx bx-id-card text-xs" aria-hidden="true" />
                            <span>{T.table.badgeRegistration}</span>
                          </span>
                        )}
                        {service.has_subcategories && (
                          <span className={S.badgeSubcategories}>
                            <i className="bx bx-group text-xs" aria-hidden="true" />
                            <span>{T.table.badgeSubcategories}</span>
                          </span>
                        )}
                        {service.requires_cubicle && (
                          <span className={S.badgeCubicles}>
                            <i className="bx bx-door-open text-xs" aria-hidden="true" />
                            <span>{T.table.badgeCubicles}</span>
                          </span>
                        )}
                        {service.requires_nurse && (
                          <span className={S.badgeNurse}>
                            <i className="bx bx-clipboard text-xs" aria-hidden="true" />
                            <span>{T.table.badgeNurse}</span>
                          </span>
                        )}
                        {service.show_on_monitor !== false && (
                          <span className={S.badgeMonitor}>
                            <i className="bx bx-tv text-xs" aria-hidden="true" />
                            <span>{T.table.badgeMonitor}</span>
                          </span>
                        )}
                        {service.auto_assign && (
                          <span className={S.badgeAutoAssign}>
                            <i className="bx bx-shuffle text-xs" aria-hidden="true" />
                            <span>{T.table.badgeAutoAssign}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={S.td}>
                      <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#a3a3a3] rounded-md">
                        #{service.display_order}
                      </span>
                    </td>
                    <td className={`${S.td} text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(service)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#a8071a] dark:text-[#f87171] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="bx bx-edit-alt text-sm" aria-hidden="true" />
                          <span>{T.table.editButton}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(service)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="bx bx-trash text-sm" aria-hidden="true" />
                          <span>{T.table.deleteButton}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-slate-400">
                    {T.table.emptyTitle}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Service Deletion Confirmation Modal */}
      <DeleteServiceModal
        service={deletingService}
        loading={deleteLoading}
        error={deleteError}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}