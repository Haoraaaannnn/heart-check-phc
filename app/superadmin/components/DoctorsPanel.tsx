'use client';
import { useState, useEffect } from 'react';
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Doctor | null>(null);

  const [assignSaving, setAssignSaving] = useState<string | null>(null);

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

  const handleAddClick = () => {
    setEditingDoctor(null);
    setFormName('');
    setFormSpecialty('');
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleEditClick = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormName(doc.full_name);
    setFormSpecialty(doc.specialty || '');
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
          .update({ full_name: formName, specialty: formSpecialty || null })
          .eq('id', editingDoctor.id);
        if (error) throw error;
        setFormSuccess('Doctor updated.');
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert({ full_name: formName, specialty: formSpecialty || null });
        if (error) throw error;
        setFormSuccess('Doctor added.');
      }

      setTimeout(() => {
        setShowModal(false);
        setEditingDoctor(null);
        setFormSuccess('');
        fetchAll();
      }, 1200);
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
      setShowDeleteConfirm(null);
      fetchAll();
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete.');
    } finally {
      setFormLoading(false);
    }
  };

    const handleAssign = async (cubicleId: number, cubicleNum: string, doctorId: string) => {
    setAssignSaving(cubicleNum);
    try {
        const { error } = await supabase
        .from('cubicle')
        .update({ doctorId: doctorId || null })
        .eq('id', cubicleId);

        if (error) {
        console.error('Failed to assign doctor:', error);
        alert(`Failed to assign doctor: ${error.message}`);
        return;
        }

        await fetchAll();
    } finally {
        setAssignSaving(null);
    }
    };

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Doctor list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Doctors</h2>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm cursor-pointer"
          >
            + Add Doctor
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-400 text-sm">No doctors added yet.</td></tr>
            )}
            {doctors.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{doc.full_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{doc.specialty || '—'}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <button onClick={() => handleEditClick(doc)} className="text-blue-600 hover:text-blue-800 mr-3 cursor-pointer">Edit</button>
                  <button onClick={() => setShowDeleteConfirm(doc)} className="text-red-600 hover:text-red-800 cursor-pointer">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cubicle assignment */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Cubicle Assignments</h2>
          <p className="text-gray-500 text-sm mt-1">Assign a doctor to each cubicle. Reflects immediately on the monitor screens.</p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cubicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Doctor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cubicles.map(cube => (
              <tr key={cube.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{cube.cubicleNum}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cube.category}{cube.subcategory ? ` - ${cube.subcategory}` : ''}</td>
                <td className="px-6 py-4 text-sm">
                  <select
                    value={cube.doctorId || ''}
                    disabled={assignSaving === cube.cubicleNum}
                    onChange={(e) => handleAssign(cube.id, cube.cubicleNum, e.target.value)}
                    className="w-full max-w-xs p-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Unassigned —</option>
                    {doctors.filter(d => d.active).map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
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
              <input
                type="text"
                placeholder="Full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Specialty (optional)"
                value={formSpecialty}
                onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

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

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Delete</h2>
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm.full_name}</span>?
              <br />
              <span className="text-sm text-red-500">They'll be unassigned from any cubicle. This cannot be undone.</span>
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
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