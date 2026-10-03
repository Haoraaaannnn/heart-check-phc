/**
 * @fileoverview Rooms and Cubicles management panel for the SuperAdmin facilities module.
 *
 * Allows hospital administrators to configure consultation rooms, add screening
 * and doctor cubicles, rename physical spaces, and manage departmental groupings.
 *
 * @module app/superadmin/components/RoomsPanel
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { SERVICES, SERVICES_WITH_SUBCATEGORIES, SUBCATEGORIES } from '@/lib/facilities';
import { FACILITIES_TEXTS } from '../facilities/constants/facilitiesTexts';
import { FACILITIES_STYLES } from '../facilities/constants/facilitiesStyles';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface Cubicle {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory: string | null;
}

interface Group {
  category: string;
  subcategory: string | null;
  room: number;
  cubicles: Cubicle[];
}

type ModalState =
  | { type: 'addRoom' }
  | { type: 'renameRoom'; group: Group }
  | { type: 'addCubicle'; group: Group }
  | { type: 'editCubicle'; cubicle: Cubicle }
  | { type: 'confirm'; title: string; message: string; run: () => Promise<void> }
  | null;

const sectionLabel = (category: string, sub: string | null) =>
  sub ? `${category} · ${sub}` : category;

/**
 * Renders the rooms and cubicles configuration interface.
 *
 * @returns JSX element containing the rooms panel.
 */
export function RoomsPanel() {
  const S = FACILITIES_STYLES;
  const B = SUPERADMIN_STYLES.buttons;
  const T = FACILITIES_TEXTS.rooms;

  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [fCategory, setFCategory] = useState(SERVICES[0]);
  const [fSub, setFSub] = useState(SUBCATEGORIES[0]);
  const [fRoom, setFRoom] = useState('');
  const [fCount, setFCount] = useState('1');
  const [fName, setFName] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminApi('/api/superadmin/cubicles');
      setCubicles(data.cubicles ?? []);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => {
    const groups = new Map<string, Group>();
    for (const c of cubicles) {
      const key = `${c.category}::${c.subcategory ?? ''}::${c.room}`;
      if (!groups.has(key)) {
        groups.set(key, {
          category: c.category,
          subcategory: c.subcategory,
          room: c.room,
          cubicles: [],
        });
      }
      groups.get(key)!.cubicles.push(c);
    }
    const bySection = new Map<string, Group[]>();
    [...groups.values()]
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          (a.subcategory ?? '').localeCompare(b.subcategory ?? '') ||
          a.room - b.room
      )
      .forEach((g) => {
        const label = sectionLabel(g.category, g.subcategory);
        bySection.set(label, [...(bySection.get(label) ?? []), g]);
      });
    return [...bySection.entries()];
  }, [cubicles]);

  const openModal = (m: ModalState) => {
    setModalError('');
    setFName('');
    setFRoom('');
    setFCount('1');
    if (m?.type === 'editCubicle') setFName(m.cubicle.cubicleNum);
    if (m?.type === 'renameRoom') setFRoom(String(m.group.room));
    setModal(m);
  };

  const needsSub = SERVICES_WITH_SUBCATEGORIES.includes(fCategory);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setModalError('');
    try {
      switch (modal.type) {
        case 'addRoom':
          await adminApi('/api/superadmin/rooms', 'POST', {
            category: fCategory,
            subcategory: needsSub ? fSub : null,
            room: Number(fRoom),
            cubicleCount: Number(fCount),
          });
          break;
        case 'renameRoom':
          await adminApi('/api/superadmin/rooms', 'PUT', {
            category: modal.group.category,
            subcategory: modal.group.subcategory,
            room: modal.group.room,
            newRoom: Number(fRoom),
          });
          break;
        case 'addCubicle':
          await adminApi('/api/superadmin/cubicles', 'POST', {
            category: modal.group.category,
            subcategory: modal.group.subcategory,
            room: modal.group.room,
            cubicleNum: fName.trim() || undefined,
          });
          break;
        case 'editCubicle':
          await adminApi('/api/superadmin/cubicles', 'PUT', {
            id: modal.cubicle.id,
            cubicleNum: fName,
          });
          break;
        case 'confirm':
          await modal.run();
          break;
      }
      setModal(null);
      await load();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRoom = (g: Group) =>
    openModal({
      type: 'confirm',
      title: `Delete Room ${g.room}?`,
      message: `This permanently deletes Room ${g.room} (${sectionLabel(
        g.category,
        g.subcategory
      )}) and its ${g.cubicles.length} cubicle(s).`,
      run: async () => {
        await adminApi('/api/superadmin/rooms', 'DELETE', {
          category: g.category,
          subcategory: g.subcategory,
          room: g.room,
        });
      },
    });

  const confirmDeleteCubicle = (c: Cubicle) =>
    openModal({
      type: 'confirm',
      title: 'Delete Cubicle?',
      message: `This permanently deletes ${c.cubicleNum}.`,
      run: async () => {
        await adminApi('/api/superadmin/cubicles', 'DELETE', { id: c.id });
      },
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
    <div className={S.container}>
      {/* Header and Add Button */}
      <div className={S.sectionHeader}>
        <div>
          <h2 className={S.sectionTitle}>
            <i className="bx bx-door-open text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>Consultation Rooms & Cubicles</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organized by clinical specialty and physical outpatient examination rooms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal({ type: 'addRoom' })}
          className={B.primary}
        >
          <i className="bx bx-plus" aria-hidden="true" />
          <span>{T.addRoomButton}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {sections.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {T.emptyState}
          </p>
        </div>
      ) : (
        sections.map(([label, groups]) => (
          <div key={label} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                {label}
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div key={g.room} className={S.roomCard}>
                  {/* Room Header */}
                  <div className={S.roomCardHeader}>
                    <div className={S.roomTitle}>
                      <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                        R{g.room}
                      </span>
                      <span>Room {g.room}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({g.cubicles.length} cubicles)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openModal({ type: 'renameRoom', group: g })}
                        className="px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        {T.renameRoomButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteRoom(g)}
                        className="px-2 py-1 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
                      >
                        {T.deleteRoomButton}
                      </button>
                    </div>
                  </div>

                  {/* Cubicles Grid */}
                  <div className={S.cubicleGrid}>
                    {g.cubicles.map((c) => (
                      <div key={c.id} className={S.cubicleChip}>
                        <span className="truncate">{c.cubicleNum}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={() => openModal({ type: 'editCubicle', cubicle: c })}
                            className="p-1 hover:text-rose-600 transition"
                            title="Edit cubicle"
                          >
                            <i className="bx bx-edit text-sm" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteCubicle(c)}
                            className="p-1 hover:text-red-600 transition"
                            title="Delete cubicle"
                          >
                            <i className="bx bx-trash text-sm" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => openModal({ type: 'addCubicle', group: g })}
                      className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <i className="bx bx-plus" aria-hidden="true" />
                      <span>{T.addCubicleButton}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal Dialog */}
      {modal && (
        <div className={S.modalBackdrop} role="dialog" aria-modal="true">
          <div className={S.modalPanel}>
            {modal.type === 'confirm' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center text-xl shrink-0">
                    <i className="bx bx-error" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {modal.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {modal.message}
                </p>
                {modalError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                    {modalError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    disabled={saving}
                    className={B.secondary}
                  >
                    {T.cancelButton}
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={saving}
                    className={B.danger}
                  >
                    {saving ? T.savingButton : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="bx bx-edit text-rose-600" aria-hidden="true" />
                  <span>
                    {modal.type === 'addRoom' && T.modalAddTitle}
                    {modal.type === 'renameRoom' && T.modalRenameTitle}
                    {modal.type === 'addCubicle' && T.modalAddCubicleTitle}
                    {modal.type === 'editCubicle' && T.modalEditCubicleTitle}
                  </span>
                </h3>

                {modalError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                    {modalError}
                  </div>
                )}

                {modal.type === 'addRoom' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {T.categoryLabel}
                      </label>
                      <select
                        value={fCategory}
                        onChange={(e) => setFCategory(e.target.value)}
                        className={S.select}
                      >
                        {SERVICES.map((s) => (
                          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {needsSub && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {T.subcategoryLabel}
                        </label>
                        <select
                          value={fSub}
                          onChange={(e) => setFSub(e.target.value)}
                          className={S.select}
                        >
                          {SUBCATEGORIES.map((s) => (
                            <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {T.roomNumberLabel}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={fRoom}
                        onChange={(e) => setFRoom(e.target.value)}
                        placeholder="e.g. 101"
                        className={S.input}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {T.cubicleCountLabel}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={fCount}
                        onChange={(e) => setFCount(e.target.value)}
                        className={S.input}
                        required
                      />
                    </div>
                  </>
                )}

                {modal.type === 'renameRoom' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      New Room Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={fRoom}
                      onChange={(e) => setFRoom(e.target.value)}
                      className={S.input}
                      required
                    />
                  </div>
                )}

                {(modal.type === 'addCubicle' || modal.type === 'editCubicle') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {T.cubicleNameLabel}
                    </label>
                    <input
                      type="text"
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      placeholder={T.cubicleNamePlaceholder}
                      className={S.input}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    disabled={saving}
                    className={B.secondary}
                  >
                    {T.cancelButton}
                  </button>
                  <button type="submit" disabled={saving} className={B.primary}>
                    {saving ? T.savingButton : T.saveButton}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}