'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Doctor, Cubicle } from '@/types/Types';

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

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [savingCubicleId, setSavingCubicleId] = useState<number | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: docData }, { data: cubeData }] = await Promise.all([
      supabase.from('doctors').select('*').order('full_name', { ascending: true }),
      supabase.from('cubicle').select('*').order('category', { ascending: true }).order('room', { ascending: true }).order('cubicleNum', { ascending: true }),
    ]);
    setDoctors(docData || []);
    setCubicles(cubeData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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
        setFormSuccess('Doctor updated.');
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert({ full_name: formName, specialty: formSpecialty || null, active: formActive });
        if (error) throw error;
        setFormSuccess('Doctor added.');
      }

      setTimeout(() => {
        setShowModal(false);
        setEditingDoctor(null);
        setFormSuccess('');
        fetchAll();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong.');
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
      setFormError(err.message || 'Failed to delete.');
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
      alert(`Failed to update doctor: ${error.message}`);
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
      alert(`Failed to update assignment: ${error.message}`);
    }
    setSavingCubicleId(null);
  };

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Doctors</h2>
          <p className="text-gray-500 text-sm mt-1">
            Add doctors, then pick one below to choose which cubicles they cover.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer"
        >
          + Add Doctor
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <i className="bx bx-plus-medical text-2xl text-blue-500"></i>
          </div>
          <p className="text-gray-700 font-semibold">No doctors yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Add a doctor to start assigning them to cubicles.</p>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
          >
            + Add Doctor
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map(doc => {
              const isActive = doc.active !== false;
              const isSelected = selectedDoctorId === doc.id;
              const roomCount = cubicleCountByDoctor[doc.id] || 0;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(isSelected ? null : doc.id)}
                  className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-blue-200'
                  } ${!isActive ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{doc.full_name}</p>
                      <p className={`text-xs mt-0.5 truncate ${doc.specialty ? 'text-gray-500' : 'text-gray-300 italic'}`}>
                        {doc.specialty || 'No specialty set'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {roomCount} cubicle{roomCount === 1 ? '' : 's'} assigned
                    </span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActive(doc)}
                        title={isActive ? 'Mark inactive' : 'Mark active'}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                      >
                        <i className={`bx ${isActive ? 'bx-toggle-right' : 'bx-toggle-left'} text-lg`}></i>
                      </button>
                      <button
                        onClick={() => handleEditClick(doc)}
                        title="Edit doctor"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition"
                      >
                        <i className="bx bx-pencil text-sm"></i>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(doc)}
                        title="Delete doctor"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition"
                      >
                        <i className="bx bx-trash text-sm"></i>
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <p className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 -mb-1">
                      <i className="bx bx-check-circle"></i> Editing this doctor's cubicles below
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedDoctor ? `Cubicles for ${selectedDoctor.full_name}` : 'Cubicle assignments'}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {selectedDoctor
                    ? 'Tap a cubicle to assign it to them, or tap again to remove it.'
                    : 'Select a doctor above to assign their cubicles.'}
                </p>
              </div>
              {selectedDoctor && (
                <button
                  onClick={() => setSelectedDoctorId(null)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>

            <div className="p-6 flex flex-col gap-5 max-h-[420px] overflow-y-auto">
              {Object.entries(groupedCubicles).map(([groupLabel, groupCubicles]) => (
                <div key={groupLabel}>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{groupLabel}</p>
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
                          className={`relative flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition min-w-[112px] ${
                            isThisDoctor
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                              : isOtherDoctor
                              ? 'border-gray-200 bg-gray-50 text-gray-600'
                              : 'border-gray-200 bg-white text-gray-700'
                          } ${
                            selectedDoctor && !isSaving
                              ? isThisDoctor
                                ? 'hover:bg-blue-700'
                                : 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                              : 'cursor-default'
                          }`}
                        >
                          <span className="text-xs font-semibold">{cube.cubicleNum}</span>
                          <span className={`text-[11px] ${isThisDoctor ? 'text-blue-100' : 'text-gray-400'}`}>
                            Room {cube.room}
                          </span>
                          {assignedName && (
                            <span className={`text-[10px] font-medium mt-0.5 ${isThisDoctor ? 'text-blue-100' : 'text-gray-500'}`}>
                              {isThisDoctor ? '✓ Assigned' : `Dr. ${assignedName}`}
                            </span>
                          )}
                          {!assignedName && (
                            <span className="text-[10px] font-medium mt-0.5 text-gray-300">Unassigned</span>
                          )}
                          {isSaving && (
                            <span className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingDoctor ? 'Edit Doctor' : 'Add Doctor'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                placeholder="e.g. Juan Dela Cruz"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
              <input
                type="text"
                placeholder="Optional, e.g. Cardiology"
                value={formSpecialty}
                onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="flex items-center gap-2 mb-5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Active — available for cubicle assignment
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingDoctor(null); setFormError(''); setFormSuccess(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving...' : (editingDoctor ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Delete</h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm.full_name}</span>?
              <br />
              <span className="text-sm text-red-500">
                They'll be unassigned from {cubicleCountByDoctor[showDeleteConfirm.id] || 0} cubicle
                {(cubicleCountByDoctor[showDeleteConfirm.id] || 0) === 1 ? '' : 's'}. This cannot be undone.
              </span>
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowDeleteConfirm(null); setFormError(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={formLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}