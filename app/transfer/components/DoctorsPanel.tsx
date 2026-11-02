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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDoctorDirectory, saveDoctorAction } from '@/lib/doctors/client';
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
  const [canManageDirectory, setCanManageDirectory] = useState(false);
  const [editableCubicleIds, setEditableCubicleIds] = useState<number[]>([]);
  const [editableDoctorIds, setEditableDoctorIds] = useState<string[]>([]);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'assigned' | 'inactive'>('all');

  /**
   * Fetches all registered doctors and cubicle records.
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const directory = await fetchDoctorDirectory();
      setDoctors(directory.doctors); setCubicles(directory.cubicles);
      setCanManageDirectory(directory.canManageDirectory);
      setEditableCubicleIds(directory.editableCubicleIds); setEditableDoctorIds(directory.editableDoctorIds);
    } catch (error: unknown) {
      setActionErrorModal({ title: 'Unable to load doctors', message: error instanceof Error ? error.message : 'Please retry loading the doctor directory.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => void fetchAll(), 0);
    return () => clearTimeout(timeoutId);
  }, [fetchAll]);

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

  const activeDoctorsCount = useMemo(
    () => doctors.filter(d => d.active !== false).length,
    [doctors]
  );

  const assignedDoctorsCount = useMemo(
    () => doctors.filter(d => (cubicleCountByDoctor[d.id] || 0) > 0).length,
    [doctors, cubicleCountByDoctor]
  );

  const totalAssignedCubicles = useMemo(
    () => cubicles.filter(c => Boolean(c.doctorId)).length,
    [cubicles]
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = doc.full_name.toLowerCase().includes(query);
        const matchesSpecialty = (doc.specialty || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSpecialty) return false;
      }
      if (statusFilter === 'active') return doc.active !== false;
      if (statusFilter === 'inactive') return doc.active === false;
      if (statusFilter === 'assigned') return (cubicleCountByDoctor[doc.id] || 0) > 0;
      return true;
    });
  }, [doctors, searchQuery, statusFilter, cubicleCountByDoctor]);

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
      await saveDoctorAction({ action: editingDoctor ? 'update' : 'create', ...(editingDoctor ? { id: editingDoctor.id } : {}),
        full_name: formName, specialty: formSpecialty || null, active: formActive });
      setFormSuccess(editingDoctor ? transferTexts.doctorUpdatedSuccess : transferTexts.doctorAddedSuccess);

      setTimeout(() => {
        setShowModal(false);
        setEditingDoctor(null);
        setFormSuccess('');
        fetchAll();
      }, 1000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : transferTexts.somethingWentWrongError);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (doc: Doctor) => {
    setFormLoading(true);
    try {
      await saveDoctorAction({ action: 'delete', id: doc.id });
      if (selectedDoctorId === doc.id) setSelectedDoctorId(null);
      setShowDeleteConfirm(null);
      fetchAll();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : transferTexts.failedToDeleteError);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (doc: Doctor) => {
    const nextActive = doc.active === false;
    try {
      await saveDoctorAction({ action: 'active', id: doc.id, active: nextActive });
      setDoctors(prev => prev.map(d => (d.id === doc.id ? { ...d, active: nextActive } : d)));
    } catch (error: unknown) {
      setActionErrorModal({
        title: transferTexts.doctorUpdateFailedTitle,
        message: error instanceof Error ? error.message : 'Doctor availability was not saved.',
      });
    }
  };

  const handleToggleAssign = async (cubicle: Cubicle) => {
    if (!selectedDoctor) return;
    const previousDoctorId = cubicle.doctorId ?? null;
    const nextDoctorId = previousDoctorId === selectedDoctor.id ? null : selectedDoctor.id;

    setSavingCubicleId(cubicle.id);
    try {
      await saveDoctorAction({ action: 'assign', cubicleId: cubicle.id, doctorId: nextDoctorId, expectedDoctorId: previousDoctorId });
      await fetchAll();
    } catch (error: unknown) {
      setActionErrorModal({
        title: transferTexts.assignmentUpdateFailedTitle,
        message: error instanceof Error ? error.message : 'The cubicle assignment was not saved.',
      });
    }
    setSavingCubicleId(null);
  };

  if (loading) {
    return <p className="text-slate-400 dark:text-[#a3a3a3] text-sm">{transferTexts.loadingDoctors}</p>;
  }

  return (
    <div className={doctorsPanelStyles.container}>
      {/* Top Header & Search / Filter Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Role & Station Guidance Notice */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f5]">
              Physician Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#888888] mt-0.5">
              {canManageDirectory
                ? 'Select a physician below to view and assign cubicle stations, or add new physicians.'
                : editableCubicleIds.length > 0
                ? 'Select a physician to assign to your stations. You can edit doctors assigned to your stations.'
                : 'Doctor directory. An administrator must assign a station before you can edit its doctors.'}
            </p>
          </div>

          {canManageDirectory && (
            <button
              type="button"
              onClick={handleAddClick}
              className={doctorsPanelStyles.addDoctorBtn}
            >
              {transferTexts.addDoctorBtn}
            </button>
          )}
        </div>

        {/* Quick Stats Pill Strip */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#333] font-medium">
            Total Doctors: <strong className="font-bold text-slate-900 dark:text-white">{doctors.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-medium">
            Active: <strong className="font-bold">{activeDoctorsCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-medium">
            Assigned: <strong className="font-bold">{assignedDoctorsCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#333] font-medium">
            Stations Assigned: <strong className="font-bold text-slate-900 dark:text-white">{totalAssignedCubicles} / {cubicles.length}</strong>
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search physician by name or specialty..."
              className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#2e2e2e] rounded-lg text-slate-900 dark:text-[#f5f5f5] placeholder-slate-400 dark:placeholder-[#666] focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#252525]'
                }`}
              >
                All ({doctors.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#252525]'
                }`}
              >
                Active ({activeDoctorsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('assigned')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  statusFilter === 'assigned'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#252525]'
                }`}
              >
                Assigned ({assignedDoctorsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#252525]'
                }`}
              >
                Inactive ({doctors.length - activeDoctorsCount})
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-[#a3a3a3] font-medium whitespace-nowrap">
              Stations: <strong className="font-bold text-slate-800 dark:text-white">{totalAssignedCubicles} / {cubicles.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className={doctorsPanelStyles.emptyStateCard}>
          <p className={doctorsPanelStyles.emptyStateTitle}>
            {transferTexts.noRoomsConfiguredTitle}
          </p>
          <p className={doctorsPanelStyles.emptyStateDesc}>
            {transferTexts.addDoctorFirstNotice}
          </p>
          {canManageDirectory && (
            <button
              type="button"
              onClick={handleAddClick}
              className={doctorsPanelStyles.addDoctorBtn}
            >
              {transferTexts.addDoctorBtn}
            </button>
          )}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className={doctorsPanelStyles.emptyStateCard}>
          <p className={doctorsPanelStyles.emptyStateTitle}>
            No doctors match your filter
          </p>
          <p className={doctorsPanelStyles.emptyStateDesc}>
            Try clearing your search query or switching filter tabs.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 border border-blue-200 dark:border-blue-900 transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Doctor Cards Grid (Spacious 2 columns to prevent text crowding) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDoctors.map(doc => {
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
                  } ${!isActive ? 'opacity-75' : ''}`}
                >
                  {/* Doctor Info Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-[#f5f5f5] leading-snug break-words">
                        {doc.full_name}
                      </p>
                      {doc.auth_id && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-2 py-0.5 rounded">
                          Doctor Account
                        </span>
                      )}
                      <p className="text-xs font-medium text-slate-500 dark:text-[#a3a3a3] mt-0.5 break-words">
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
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {isActive ? transferTexts.activeStatus : transferTexts.inactiveStatus}
                    </span>
                  </div>

                  {/* Selected for Assignment Indicator */}
                  {isSelected && (
                    <div className="px-2.5 py-1.5 rounded-md bg-blue-100/90 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-800 text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                      <span>Selected for assignment</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Tap station below</span>
                    </div>
                  )}

                  {/* Non-Colliding Footer: Station count on Row 1, Action buttons on Row 2 */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#262626] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#888888]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {transferTexts.cubicleAssignedCount(roomCount)}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          Active
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center justify-end gap-1.5 flex-wrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={!editableDoctorIds.includes(doc.id)}
                        onClick={() => handleToggleActive(doc)}
                        className={`${doctorsPanelStyles.actionBtnToggle} disabled:cursor-not-allowed disabled:opacity-40`}
                        title={isActive ? 'Deactivate doctor' : 'Activate doctor'}
                      >
                        {isActive ? transferTexts.deactivateBtn : transferTexts.activateBtn}
                      </button>
                      <button
                        type="button"
                        disabled={!editableDoctorIds.includes(doc.id)}
                        onClick={() => handleEditClick(doc)}
                        className={`${doctorsPanelStyles.actionBtnEdit} disabled:cursor-not-allowed disabled:opacity-40`}
                        title="Edit doctor details"
                      >
                        {transferTexts.editBtn}
                      </button>
                      {canManageDirectory && !doc.auth_id && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(doc)}
                          className={doctorsPanelStyles.actionBtnDelete}
                          title="Delete doctor"
                        >
                          {transferTexts.deleteBtn}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cubicles Association Section */}
          <div className={doctorsPanelStyles.assignmentSection}>
            <div className={doctorsPanelStyles.assignmentHeader}>
              <div className="min-w-0 flex-1">
                <h3 className={doctorsPanelStyles.assignmentTitle}>
                  {selectedDoctor
                    ? transferTexts.cubiclesForDoctor(selectedDoctor.full_name)
                    : transferTexts.cubicleAssignmentsTitle}
                </h3>
                <p className={doctorsPanelStyles.assignmentSubtitle}>
                  {selectedDoctor
                    ? `Assigning ${selectedDoctor.full_name}${selectedDoctor.specialty ? ` (${selectedDoctor.specialty})` : ''}. Tap any station below to assign or unassign.`
                    : 'Select a physician above to view and assign cubicle stations.'}
                </p>
              </div>
              {selectedDoctor && (
                <button
                  type="button"
                  onClick={() => setSelectedDoctorId(null)}
                  className={doctorsPanelStyles.doneBtn}
                >
                  Done / Deselect
                </button>
              )}
            </div>

            <div className={doctorsPanelStyles.assignmentBody}>
              {Object.entries(groupedCubicles).map(([groupLabel, groupCubicles]) => (
                <div key={groupLabel}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <p className={doctorsPanelStyles.groupTitle}>{groupLabel}</p>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#222] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#333]">
                      {groupCubicles.length} {groupCubicles.length === 1 ? 'Station' : 'Stations'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {groupCubicles.map(cube => {
                      const assignedName = cube.doctorId ? doctorNameById.get(cube.doctorId) : null;
                      const isThisDoctor = !!selectedDoctor && cube.doctorId === selectedDoctor.id;
                      const isOtherDoctor = !!cube.doctorId && !isThisDoctor;
                      const isSaving = savingCubicleId === cube.id;
                      const isOccupiedByOther = Boolean(cube.occupiedBy && (!selectedDoctor || cube.occupiedBy.username !== selectedDoctor.full_name));

                      return (
                        <button
                          key={cube.id}
                          type="button"
                          disabled={!selectedDoctor || isSaving || !editableCubicleIds.includes(cube.id) || isOccupiedByOther}
                          onClick={() => handleToggleAssign(cube)}
                          title={
                            isOccupiedByOther
                              ? `In use by ${cube.occupiedBy?.username}. Cannot reassign while occupied.`
                              : !selectedDoctor
                              ? 'Select a doctor above to manage this cubicle'
                              : isThisDoctor
                              ? `Assigned to ${selectedDoctor.full_name}. Tap to unassign.`
                              : isOtherDoctor
                              ? `Assigned to Dr. ${assignedName}. Tap to reassign to ${selectedDoctor.full_name}.`
                              : `Unassigned. Tap to assign to ${selectedDoctor.full_name}.`
                          }
                          className={`${doctorsPanelStyles.cubicleTileBase} ${
                            isOccupiedByOther
                              ? 'opacity-60 bg-slate-100 dark:bg-[#1a1a1a] border-slate-200 dark:border-[#2e2e2e] cursor-not-allowed text-slate-400 dark:text-[#737373]'
                              : isThisDoctor
                              ? doctorsPanelStyles.cubicleTileThisDoctor
                              : isOtherDoctor
                              ? doctorsPanelStyles.cubicleTileOtherDoctor
                              : doctorsPanelStyles.cubicleTileUnassigned
                          } ${(!selectedDoctor || isSaving) && !isOccupiedByOther ? doctorsPanelStyles.cubicleTileDisabled : ''}`}
                        >
                          {/* Top Header of Tile */}
                          <div className="flex items-center justify-between w-full gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-mono font-black whitespace-nowrap shrink-0 ${
                                isThisDoctor
                                  ? 'bg-blue-800 text-white'
                                  : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                              }`}
                            >
                              {cube.cubicleNum}
                            </span>
                            <span
                              className={`text-xs font-semibold leading-none whitespace-nowrap shrink-0 ${
                                isThisDoctor
                                  ? doctorsPanelStyles.cubicleTileRoomActive
                                  : doctorsPanelStyles.cubicleTileRoom
                              }`}
                            >
                              {transferTexts.roomLabel(cube.room)}
                            </span>
                          </div>

                          {/* Doctor Assignment Status */}
                          <div className="w-full">
                            {cube.occupiedBy ? (
                              <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[9px] leading-tight px-1.5 py-0.5 rounded font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 whitespace-nowrap inline-flex items-center gap-1">
                                  <i className="bx bx-lock-alt text-xs text-amber-600 dark:text-amber-400" />
                                  <span>In use: {cube.occupiedBy.username} (Locked)</span>
                                </span>
                              </div>
                            ) : assignedName ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isThisDoctor && (
                                  <span className="w-3.5 h-3.5 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                    ✓
                                  </span>
                                )}
                                <span
                                  className={
                                    isThisDoctor
                                      ? doctorsPanelStyles.cubicleTileDoctorActive
                                      : doctorsPanelStyles.cubicleTileDoctor
                                  }
                                >
                                  {transferTexts.assignedDoctorLabel(assignedName)}
                                </span>
                              </div>
                            ) : (
                              <span className={doctorsPanelStyles.cubicleTileDoctorUnassigned}>
                                {transferTexts.unassignedCubicleLabel}
                              </span>
                            )}

                            {!isOccupiedByOther && selectedDoctor && (
                              <p
                                className={`text-[10px] mt-1 whitespace-nowrap ${
                                  isThisDoctor
                                    ? 'text-blue-100 font-medium'
                                    : isOtherDoctor
                                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {isThisDoctor
                                  ? 'Assigned · Tap to unassign'
                                  : isOtherDoctor
                                  ? 'Tap to reassign here'
                                  : 'Tap to assign here'}
                              </p>
                            )}
                          </div>

                          {/* Loading spinner */}
                          {isSaving && (
                            <span className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 rounded-xl">
                              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
