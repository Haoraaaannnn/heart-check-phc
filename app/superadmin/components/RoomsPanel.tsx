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
      title: `${T.deleteRoomTitlePrefix} ${g.room}?`,
      message: `${T.deleteRoomMessagePrefix} ${g.room} (${sectionLabel(
        g.category,
        g.subcategory
      )}) and its ${g.cubicles.length} ${T.cubiclesCountSuffix}.`,
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
      title: T.deleteCubicleTitle,
      message: `${T.deleteCubicleMessagePrefix} ${c.cubicleNum}.`,
      run: async () => {
        await adminApi('/api/superadmin/cubicles', 'DELETE', { id: c.id });
      },
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
    <div className={S.container}>
      {/* Header and Add Button */}
      <div className={S.sectionHeader}>
        <div>
          <h2 className={S.sectionTitle}>
            <i className="bx bx-door-open text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>{T.sectionTitle}</span>
          </h2>
          <p className={S.sectionSubtitle}>
            {T.sectionSubtitle}
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
        <div className={S.errorBanner}>
          {error}
        </div>
      )}

      {sections.length === 0 ? (
        <div className={S.emptyCard}>
          <p className={S.emptyText}>
            {T.emptyState}
          </p>
        </div>
      ) : (
        sections.map(([label, groups]) => (
          <div key={label} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={S.categoryPill}>
                {label}
              </span>
              <div className={S.sectionDivider} />
            </div>

            <div className={S.roomsGrid}>
              {groups.map((g) => (
                <div key={g.room} className={S.roomCard}>
                  {/* Room Header */}
                  <div className={S.roomCardHeader}>
                    <div className={S.roomTitle}>
                      <span className={S.roomBadge}>
                        R{g.room}
                      </span>
                      <span>{T.roomPrefix} {g.room}</span>
                      <span className={S.roomCountBadge}>
                        ({g.cubicles.length} {T.cubiclesCountSuffix})
                      </span>
                    </div>

                    <div className={S.roomActionsGroup}>
                      <button
                        type="button"
                        onClick={() => openModal({ type: 'renameRoom', group: g })}
                        className={S.roomRenameBtn}
                      >
                        {T.renameRoomButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteRoom(g)}
                        className={S.roomDeleteBtn}
                      >
                        {T.deleteRoomButton}
                      </button>
                    </div>
                  </div>

                  {/* Cubicles Grid */}
                  <div className={S.cubicleGrid}>
                    {g.cubicles.map((c) => (
                      <div key={c.id} className={S.cubicleChip}>
                        <span className={S.cubicleLabel}>{c.cubicleNum}</span>
                        <div className={S.cubicleActions}>
                          <button
                            type="button"
                            onClick={() => openModal({ type: 'editCubicle', cubicle: c })}
                            className={S.cubicleEditBtn}
                            title={T.editCubicleAria}
                          >
                            <i className="bx bx-edit text-sm" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteCubicle(c)}
                            className={S.cubicleDeleteBtn}
                            title={T.deleteCubicleAria}
                          >
                            <i className="bx bx-trash text-sm" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => openModal({ type: 'addCubicle', group: g })}
                      className={S.cubicleAddBtn}
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
                  <div className={S.confirmIconBox}>
                    <i className="bx bx-error" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className={S.modalHeader}>
                      {modal.title}
                    </h3>
                  </div>
                </div>
                <p className={S.confirmMessage}>
                  {modal.message}
                </p>
                {modalError && (
                  <div className={S.modalErrorBanner}>
                    {modalError}
                  </div>
                )}
                <div className={S.modalFooter}>
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
                    {saving ? T.savingButton : T.confirmDelete}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className={S.modalHeader}>
                  <i className="bx bx-edit text-[#a8071a] dark:text-[#f87171]" aria-hidden="true" />
                  <span>
                    {modal.type === 'addRoom' && T.modalAddTitle}
                    {modal.type === 'renameRoom' && T.modalRenameTitle}
                    {modal.type === 'addCubicle' && T.modalAddCubicleTitle}
                    {modal.type === 'editCubicle' && T.modalEditCubicleTitle}
                  </span>
                </h3>

                {modalError && (
                  <div className={S.modalErrorBanner}>
                    {modalError}
                  </div>
                )}

                {modal.type === 'addRoom' && (
                  <>
                    <div className={S.fieldGroup}>
                      <label className={S.fieldLabel}>
                        {T.categoryLabel}
                      </label>
                      <select
                        value={fCategory}
                        onChange={(e) => setFCategory(e.target.value)}
                        className={S.select}
                      >
                        {SERVICES.map((s) => (
                          <option key={s} value={s} className={S.selectOption}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {needsSub && (
                      <div className={S.fieldGroup}>
                        <label className={S.fieldLabel}>
                          {T.subcategoryLabel}
                        </label>
                        <select
                          value={fSub}
                          onChange={(e) => setFSub(e.target.value)}
                          className={S.select}
                        >
                          {SUBCATEGORIES.map((s) => (
                            <option key={s} value={s} className={S.selectOption}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className={S.fieldGroup}>
                      <label className={S.fieldLabel}>
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

                    <div className={S.fieldGroup}>
                      <label className={S.fieldLabel}>
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
                  <div className={S.fieldGroup}>
                    <label className={S.fieldLabel}>
                      {T.newRoomNumberLabel}
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
                  <div className={S.fieldGroup}>
                    <label className={S.fieldLabel}>
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

                <div className={S.modalFooter}>
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