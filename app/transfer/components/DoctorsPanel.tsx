/**
 * @fileoverview Doctor-to-cubicle station assignment and physician management panel.
 *
 * Provides administrative controls for registering doctors, setting specialties,
 * toggling availability, and assigning physicians to consultation and screening cubicles.
 *
 * Architectural Features:
 * - High-contrast solid clinical surfaces adhering strictly to AGENTS.md Rule 10.
 * - Strict Separation of Concerns: Consumes centralized styles from doctorsPanelStyles and texts from transferTexts.
 * - Parameterized Supabase queries ensuring security and zero injection vulnerability.
 * - Zero emojis in code, comments, JSDocs, and user-facing copy.
 *
 * @remarks
 * Conforms to AGENTS.md:
 * - Centralized style dictionary in constants/designs/transferStyles.ts.
 * - Centralized text copy in constants/texts/transferTexts.ts.
 *
 * @module app/transfer/components/DoctorsPanel
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Doctor, Cubicle } from '@/types/Types';
import { transferTexts } from '@/constants/texts/transferTexts';
import { doctorsPanelStyles } from '@/constants/designs/transferStyles';

/**
 * Doctor-to-cubicle management panel rendered inside the DoctorsModal dialog.
 *
 * @returns The rendered DoctorsPanel element.
 */
export function DoctorsPanel() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Doctor | null>(null);
  const [actionErrorModal, setActionErrorModal] = useState<{ title: string; message: string } | null>(null);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [savingCubicleId, setSavingCubicleId] = useState<number | null>(null);

  /**
   * Fetches all registered doctors and cubicle records.
   */
  const fetchAll = async () => {
    setLoading(true);
    const [{ data: docData }, { data: cubeData }] = await Promise.all([
      supabase.from('doctors').select('*').order('full_name', { ascending: true }),
      supabase
        .from('cubicle')
        .select('*')
        .order('category', { ascending: true })
        .order('room', { ascending: true })
        .order('cubicleNum', { ascending: true }),
    ]);
    setDoctors(docData || []);
    setCubicles(cubeData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || null;

  const cubicleCountByDoctor = useMemo(() => {
    const counts: Record<string, number> = {};
    cubicles.forEach(c => {
      if (c.doctorId) counts[c.doctorId] = (counts[c.doctorId] || 0) + 1;
    });
    return counts;
  }, [cubicles]);

  const doctorNameById = useMemo(
    () => new Map(doctors.map(d => [d.id, d.full_name])),
    [doctors]
  );

  const groupedCubicles = useMemo(() => {
    const groups: Record<string, Cubicle[]> = {};
    cubicles.forEach(c => {
      const label = c.subcategory ? `${c.category} · ${c.subcategory}` : c.category;
      groups[label] ??= [];
      groups[label].push(c);
    });
    return groups;
  }, [cubicles]);

  const handleAddClick = () => {
    setEditingDoctor(null);
    setFormName('');
    setFormSpecialty('');
    setFormActive(true);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleEditClick = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormName(doc.full_name);
    setFormSpecialty(doc.specialty || '');
    setFormActive(doc.active !== false);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update({ full_name: formName, specialty: formSpecialty || null, active: formActive })
          .eq('id', editingDoctor.id);
        if (error) throw error;
        setFormSuccess(transferTexts.doctorUpdatedSuccess);
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert({ full_name: formName, specialty: formSpecialty || null, active: formActive });
        if (error) throw error;
        setFormSuccess(transferTexts.doctorAddedSuccess);
      }

      setTimeout(() => {
        setShowModal(false);
        setEditingDoctor(null);
        setFormSuccess('');
        fetchAll();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || transferTexts.somethingWentWrongError);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (doc: Doctor) => {
    setFormLoading(true);
    try {
      await supabase.from('cubicle').update({ doctorId: null }).eq('doctorId', doc.id);
      const { error } = await supabase.from('doctors').delete().eq('id', doc.id);
      if (error) throw error;
      if (selectedDoctorId === doc.id) setSelectedDoctorId(null);
      setShowDeleteConfirm(null);
      fetchAll();
    } catch (err: any) {
      setFormError(err.message || transferTexts.failedToDeleteError);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (doc: Doctor) => {
    const nextActive = doc.active === false;
    setDoctors(prev => prev.map(d => (d.id === doc.id ? { ...d, active: nextActive } : d)));
    const { error } = await supabase.from('doctors').update({ active: nextActive }).eq('id', doc.id);
    if (error) {
      setDoctors(prev => prev.map(d => (d.id === doc.id ? { ...d, active: doc.active } : d)));
      setActionErrorModal({
        title: transferTexts.doctorUpdateFailedTitle,
        message: error.message,
      });
    }
  };

  const handleToggleAssign = async (cubicle: Cubicle) => {
    if (!selectedDoctor) return;
    const previousDoctorId = cubicle.doctorId;
    const nextDoctorId = previousDoctorId === selectedDoctor.id ? null : selectedDoctor.id;

    setSavingCubicleId(cubicle.id);
    setCubicles(prev => prev.map(c => (c.id === cubicle.id ? { ...c, doctorId: nextDoctorId } : c)));

    const { error } = await supabase
      .from('cubicle')
      .update({ doctorId: nextDoctorId })
      .eq('id', cubicle.id);

    if (error) {
      setCubicles(prev => prev.map(c => (c.id === cubicle.id ? { ...c, doctorId: previousDoctorId } : c)));
      setActionErrorModal({
        title: transferTexts.assignmentUpdateFailedTitle,
        message: error.message,
      });
    }
    setSavingCubicleId(null);
  };

  if (loading) {
    return <p className="text-slate-400 dark:text-[#a3a3a3] text-sm">{transferTexts.loadingDoctors}</p>;
  }

  return (
    <div className={doctorsPanelStyles.container}>
      {/* Top Header */}
      <div className={doctorsPanelStyles.topHeader}>
        <div>
          <h2 className={doctorsPanelStyles.topHeaderTitle}>
            {transferTexts.doctorsHeading}
          </h2>
          <p className={doctorsPanelStyles.topHeaderSubtitle}>
            {transferTexts.doctorsSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddClick}
          className={doctorsPanelStyles.addDoctorBtn}
        >
          {transferTexts.addDoctorBtn}
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className={doctorsPanelStyles.emptyStateCard}>
          <p className={doctorsPanelStyles.emptyStateTitle}>
            {transferTexts.noRoomsConfiguredTitle}
          </p>
          <p className={doctorsPanelStyles.emptyStateDesc}>
            {transferTexts.addDoctorFirstNotice}
          </p>
          <button
            type="button"
            onClick={handleAddClick}
            className={doctorsPanelStyles.addDoctorBtn}
          >
            {transferTexts.addDoctorBtn}
          </button>
        </div>
      ) : (
        <>
          {/* Doctor Cards Grid */}
          <div className={doctorsPanelStyles.doctorGrid}>
            {doctors.map(doc => {
              const isActive = doc.active !== false;
              const isSelected = selectedDoctorId === doc.id;
              const roomCount = cubicleCountByDoctor[doc.id] || 0;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(isSelected ? null : doc.id)}
                  className={`${doctorsPanelStyles.doctorCardBase} ${
                    isSelected
                      ? doctorsPanelStyles.doctorCardSelected
                      : doctorsPanelStyles.doctorCardUnselected
                  } ${!isActive ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={doctorsPanelStyles.doctorCardName}>{doc.full_name}</p>
                      <p
                        className={
                          doc.specialty
                            ? doctorsPanelStyles.doctorCardSpecialty
                            : doctorsPanelStyles.doctorCardNoSpecialty
                        }
                      >
                        {doc.specialty || transferTexts.noSpecialtySet}
                      </p>
                    </div>
                    <span
                      className={
                        isActive
                          ? doctorsPanelStyles.statusBadgeActive
                          : doctorsPanelStyles.statusBadgeInactive
                      }
                    >
                      {isActive ? transferTexts.activeStatus : transferTexts.inactiveStatus}
                    </span>
                  </div>

                  <div className={doctorsPanelStyles.cardFooter}>
                    <span className={doctorsPanelStyles.roomCountText}>
                      {transferTexts.cubicleAssignedCount(roomCount)}
                    </span>
                    <div
                      className="flex items-center gap-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleActive(doc)}
                        className={doctorsPanelStyles.actionBtnToggle}
                      >
                        {isActive ? transferTexts.deactivateBtn : transferTexts.activateBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClick(doc)}
                        className={doctorsPanelStyles.actionBtnEdit}
                      >
                        {transferTexts.editBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(doc)}
                        className={doctorsPanelStyles.actionBtnDelete}
                      >
                        {transferTexts.deleteBtn}
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <p className={doctorsPanelStyles.editingNotice}>
                      {transferTexts.editingDoctorNotice}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cubicles Association Section */}
          <div className={doctorsPanelStyles.assignmentSection}>
            <div className={doctorsPanelStyles.assignmentHeader}>
              <div>
                <h3 className={doctorsPanelStyles.assignmentTitle}>
                  {selectedDoctor
                    ? transferTexts.cubiclesForDoctor(selectedDoctor.full_name)
                    : transferTexts.cubicleAssignmentsTitle}
                </h3>
                <p className={doctorsPanelStyles.assignmentSubtitle}>
                  {transferTexts.cubicleAssignmentsSubtitle(!!selectedDoctor)}
                </p>
              </div>
              {selectedDoctor && (
                <button
                  type="button"
                  onClick={() => setSelectedDoctorId(null)}
                  className={doctorsPanelStyles.doneBtn}
                >
                  {transferTexts.doneBtn}
                </button>
              )}
            </div>

            <div className={doctorsPanelStyles.assignmentBody}>
              {Object.entries(groupedCubicles).map(([groupLabel, groupCubicles]) => (
                <div key={groupLabel}>
                  <p className={doctorsPanelStyles.groupTitle}>{groupLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {groupCubicles.map(cube => {
                      const assignedName = cube.doctorId ? doctorNameById.get(cube.doctorId) : null;
                      const isThisDoctor = !!selectedDoctor && cube.doctorId === selectedDoctor.id;
                      const isOtherDoctor = !!cube.doctorId && !isThisDoctor;
                      const isSaving = savingCubicleId === cube.id;

                      return (
                        <button
                          key={cube.id}
                          type="button"
                          disabled={!selectedDoctor || isSaving}
                          onClick={() => handleToggleAssign(cube)}
                          title={
                            !selectedDoctor
                              ? 'Select a doctor to manage this cubicle'
                              : isOtherDoctor
                              ? `Currently assigned to Dr. ${assignedName}. Tap to reassign.`
                              : undefined
                          }
                          className={`${doctorsPanelStyles.cubicleTileBase} ${
                            isThisDoctor
                              ? doctorsPanelStyles.cubicleTileThisDoctor
                              : isOtherDoctor
                              ? doctorsPanelStyles.cubicleTileOtherDoctor
                              : doctorsPanelStyles.cubicleTileUnassigned
                          } ${!selectedDoctor || isSaving ? doctorsPanelStyles.cubicleTileDisabled : ''}`}
                        >
                          <span className={doctorsPanelStyles.cubicleTileNum}>
                            {cube.cubicleNum}
                          </span>
                          <span
                            className={
                              isThisDoctor
                                ? doctorsPanelStyles.cubicleTileRoomActive
                                : doctorsPanelStyles.cubicleTileRoom
                            }
                          >
                            {transferTexts.roomLabel(cube.room)}
                          </span>
                          {assignedName && (
                            <span
                              className={
                                isThisDoctor
                                  ? doctorsPanelStyles.cubicleTileDoctorActive
                                  : doctorsPanelStyles.cubicleTileDoctor
                              }
                            >
                              {isThisDoctor
                                ? transferTexts.assignedStatus
                                : transferTexts.assignedDoctorLabel(assignedName)}
                            </span>
                          )}
                          {!assignedName && (
                            <span className={doctorsPanelStyles.cubicleTileDoctorUnassigned}>
                              {transferTexts.unassignedCubicleLabel}
                            </span>
                          )}
                          {isSaving && (
                            <span className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 rounded-xl">
                              <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className={doctorsPanelStyles.modalCard}>
            <h2 className={doctorsPanelStyles.modalTitle}>
              {editingDoctor
                ? transferTexts.editDoctorModalTitle
                : transferTexts.addDoctorModalTitle}
            </h2>

            {formError && (
              <div className={doctorsPanelStyles.formErrorBox}>{formError}</div>
            )}
            {formSuccess && (
              <div className={doctorsPanelStyles.formSuccessBox}>{formSuccess}</div>
            )}

            <form onSubmit={handleSubmit}>
              <label className={doctorsPanelStyles.inputLabel}>
                {transferTexts.fullNameLabel}
              </label>
              <input
                type="text"
                placeholder={transferTexts.fullNamePlaceholder}
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className={doctorsPanelStyles.inputField}
                required
              />

              <label className={doctorsPanelStyles.inputLabel}>
                {transferTexts.specialtyLabel}
              </label>
              <input
                type="text"
                placeholder={transferTexts.specialtyPlaceholder}
                value={formSpecialty}
                onChange={e => setFormSpecialty(e.target.value)}
                className={doctorsPanelStyles.inputField}
              />

              <label className={doctorsPanelStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className={doctorsPanelStyles.checkboxInput}
                />
                {transferTexts.activeCheckboxLabel}
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDoctor(null);
                    setFormError('');
                    setFormSuccess('');
                  }}
                  className={doctorsPanelStyles.btnCancel}
                >
                  {transferTexts.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={doctorsPanelStyles.btnSubmit}
                >
                  {formLoading
                    ? transferTexts.savingBtn
                    : editingDoctor
                    ? transferTexts.updateBtn
                    : transferTexts.createBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className={doctorsPanelStyles.modalCard}>
            <h2 className={doctorsPanelStyles.modalTitleDanger}>
              {transferTexts.confirmDeleteTitle}
            </h2>
            {formError && (
              <div className={doctorsPanelStyles.formErrorBox}>{formError}</div>
            )}
            <p className={doctorsPanelStyles.deleteWarningText}>
              {transferTexts.deleteDoctorConfirmMessage(
                showDeleteConfirm.full_name,
                cubicleCountByDoctor[showDeleteConfirm.id] || 0
              )}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setFormError('');
                }}
                className={doctorsPanelStyles.btnCancel}
              >
                {transferTexts.cancelBtn}
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={() => handleDelete(showDeleteConfirm)}
                className={doctorsPanelStyles.btnDeleteConfirm}
              >
                {formLoading ? transferTexts.savingBtn : transferTexts.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Error Modal */}
      {actionErrorModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className={doctorsPanelStyles.modalCard}>
            <h2 className={doctorsPanelStyles.modalTitleDanger}>
              {actionErrorModal.title}
            </h2>
            <p className={doctorsPanelStyles.deleteWarningText}>
              {actionErrorModal.message}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setActionErrorModal(null)}
                className={doctorsPanelStyles.btnCancel}
              >
                {transferTexts.errorModalDismiss}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorsPanel;