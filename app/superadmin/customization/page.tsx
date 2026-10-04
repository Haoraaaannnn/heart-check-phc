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
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { CUSTOMIZATION_TEXTS } from './constants/customizationTexts';
import { CUSTOMIZATION_STYLES } from './constants/customizationStyles';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

type PatientType = 'new' | 'old' | 'both';

const EMPTY_FORM: Omit<Service, 'id'> = {
  label_en: '',
  label_fil: '',
  icon_src: '',
  display_order: 0,
  description_en: '',
  description_fil: '',
  patient_type: 'both',
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
    });
    setIconQuery('');
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    const { id: _, ...rest } = service;
    setForm(rest);
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

    setSaving(true);
    setError(null);

    if (editingId === 'new') {
      const { error: insertErr } = await supabase.from('services').insert([form]);
      if (insertErr) setError(insertErr.message);
    } else if (editingId !== null) {
      const { error: updateErr } = await supabase
        .from('services')
        .update(form)
        .eq('id', editingId);
      if (updateErr) setError(updateErr.message);
    }

    setSaving(false);
    cancelEdit();
    loadServices();
  }

  async function handleDelete(id: number) {
    if (!confirm(T.table.deleteConfirm)) return;

    const { error: delErr } = await supabase.from('services').delete().eq('id', id);
    if (delErr) {
      setError(delErr.message);
    } else {
      loadServices();
    }
  }

  const isEditing = editingId !== null;

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans">
        <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={L.container}>
      <div className={L.mainWrapper}>
        {/* Header */}
        <div className={L.headerRow}>
          <div className={L.titleSection}>
            <h1 className={L.heading}>{T.header.pageTitle}</h1>
            <p className={L.subheading}>{T.header.pageDescription}</p>
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
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
                Loading services...
              </p>
            </div>
          ) : (
            <table className={S.table}>
              <thead className={S.thead}>
                <tr>
                  <th className={S.th}>{T.table.colIcon}</th>
                  <th className={S.th}>{T.table.colLabels}</th>
                  <th className={S.th}>{T.table.colPatientType}</th>
                  <th className={S.th}>{T.table.colOrder}</th>
                  <th className={`${S.th} text-right`}>{T.table.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const iconClass = resolveServiceIcon(service);
                  return (
                    <tr key={service.id} className={S.tr}>
                      <td className={S.td}>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#242424] text-[#a8071a] dark:text-[#f87171] flex items-center justify-center text-2xl shadow-2xs">
                          <i className={`bx ${iconClass}`} aria-hidden="true" />
                        </div>
                      </td>
                      <td className={S.td}>
                        <div className="font-semibold text-slate-900 dark:text-[#f5f5f5]">
                          {service.label_en}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-[#a3a3a3] italic">
                          {service.label_fil}
                        </div>
                      </td>
                      <td className={S.td}>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
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
                            onClick={() => handleDelete(service.id)}
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
                    <td colSpan={5} className="p-12 text-center text-xs text-slate-400">
                      {T.table.emptyTitle}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}